"""
Distributed Computing Lab - Experiment 4
Ricart-Agrawala Mutual Exclusion over gRPC
Applied to ChessMate: Distributed Peer-to-Peer Mutex for Shared Tournament Slot
"""

import sys
import time
import threading
from concurrent import futures
import grpc

# Supports both artwork_pb2 and chess_pb2 definitions
try:
    import artwork_pb2 as pb2
    import artwork_pb2_grpc as pb2_grpc
except ImportError:
    import chess_pb2 as pb2
    import chess_pb2_grpc as pb2_grpc

PEERS = {
    1: "localhost:60051",
    2: "localhost:60052",
    3: "localhost:60053"
}

SHARED_RESOURCE_NAME = "ChessMate Tournament Championship Submission Slot"


class Node:
    def __init__(self, node_id):
        self.id = node_id
        self.peers = {nid: addr for nid, addr in PEERS.items() if nid != node_id}
        self.clock = 0
        self.state = "RELEASED"  # RELEASED -> WANTED -> HELD
        self.request_time = None
        self.lock = threading.Lock()
        self.deferred = []  # threading.Events for peers we are making wait

    def tick(self):
        with self.lock:
            self.clock += 1
            return self.clock

    def update(self, received_ts):
        with self.lock:
            self.clock = max(self.clock, received_ts) + 1
            return self.clock

    def serve(self):
        server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
        pb2_grpc.add_MutexServiceServicer_to_server(_Servicer(self), server)
        server.add_insecure_port(PEERS[self.id])
        server.start()
        return server

    def _call_with_retry(self, addr, my_ts, max_wait=30):
        # Peers may still be starting up — retry instead of crashing
        deadline = time.time() + max_wait
        while time.time() < deadline:
            try:
                with grpc.insecure_channel(addr) as channel:
                    stub = pb2_grpc.MutexServiceStub(channel)
                    return stub.RequestAccess(
                        pb2.AccessRequest(node_id=self.id, timestamp=my_ts)
                    )
            except grpc.RpcError:
                time.sleep(0.3)
        raise RuntimeError(f"Could not reach peer at {addr}")

    def request_cs(self):
        my_ts = self.tick()
        with self.lock:
            self.state = "WANTED"
            self.request_time = my_ts

        print(f"\n[Node-{self.id}] WANTS critical section (Timestamp: {my_ts}) for '{SHARED_RESOURCE_NAME}'")

        # Broadcast request to all other peers
        for peer_id, addr in self.peers.items():
            print(f"[Node-{self.id}] -> Sending AccessRequest to Node-{peer_id} at {addr} (timestamp={my_ts})")
            reply = self._call_with_retry(addr, my_ts)
            self.update(reply.timestamp)
            print(f"[Node-{self.id}] <- Received AccessReply from Node-{peer_id}")

        # All peers have granted access
        with self.lock:
            self.state = "HELD"

        print(f"\n****************************************************************")
        print(f"*** >>> Node-{self.id}: ENTERED CRITICAL SECTION <<< ***")
        print(f"*** Resource Acquired: '{SHARED_RESOURCE_NAME}'")
        print(f"****************************************************************")
        
        # Simulate working in the critical section
        time.sleep(1.2)

        print(f"*** <<< Node-{self.id}: EXITING CRITICAL SECTION >>> ***")
        print(f"****************************************************************\n")
        self.release_cs()

    def release_cs(self):
        with self.lock:
            self.state = "RELEASED"
            to_release, self.deferred = self.deferred, []

        print(f"[Node-{self.id}] RELEASED critical section. Unblocking {len(to_release)} deferred peer request(s)...")
        for event in to_release:
            event.set()  # Lets deferred peers' RPC handlers unblock and return reply


class _Servicer(pb2_grpc.MutexServiceServicer):
    def __init__(self, node):
        self.node = node

    def RequestAccess(self, request, context):
        node = self.node
        node.update(request.timestamp)

        with node.lock:
            defer = (
                node.state == "HELD"
                or (
                    node.state == "WANTED"
                    and (node.request_time, node.id) < (request.timestamp, request.node_id)
                )
            )

        if defer:
            print(
                f"[Node-{node.id}] DEFERS request from Node-{request.node_id} "
                f"[My priority ({node.request_time}, Node-{node.id}) < Theirs ({request.timestamp}, Node-{request.node_id})]"
            )
            event = threading.Event()
            with node.lock:
                node.deferred.append(event)
            event.wait()  # BLOCKS the gRPC RPC response — this IS the Ricart-Agrawala defer!
            print(f"[Node-{node.id}] UNBLOCKING deferred request from Node-{request.node_id} now!")
        else:
            print(
                f"[Node-{node.id}] GRANTS request to Node-{request.node_id} immediately "
                f"(Node-{node.id} state={node.state})"
            )

        send_ts = node.tick()
        return pb2.AccessReply(node_id=node.id, timestamp=send_ts)


def main():
    if len(sys.argv) < 2:
        print("Usage: python node.py <node_id: 1, 2, or 3>")
        sys.exit(1)

    node_id = int(sys.argv[1])
    if node_id not in PEERS:
        print(f"Error: Node ID must be 1, 2, or 3. Got {node_id}")
        sys.exit(1)

    node = Node(node_id)
    server = node.serve()
    print("=" * 65)
    print(f"Node-{node.id} online and listening on {PEERS[node.id]}")
    print(f"Waiting 6 seconds for all peers to start up before requesting CS...")
    print("=" * 65)

    time.sleep(6)  # Allows all 3 terminals to start up and synchronize
    node.request_cs()
    time.sleep(2)
    server.stop(0)
    print(f"[Node-{node.id}] Terminated cleanly.")


if __name__ == "__main__":
    main()
