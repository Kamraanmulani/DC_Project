import sys
import time
import random
import threading
from concurrent import futures
import grpc
import raft_pb2
import raft_pb2_grpc
import chess_pb2
import chess_pb2_grpc

ALL_NODES = {
    "A": "127.0.0.1:60401",
    "B": "127.0.0.1:60402",
    "C": "127.0.0.1:60403",
}

HEARTBEAT_INTERVAL = 0.5
ELECTION_TIMEOUT_RANGE = (1.5, 3.0)


class RaftNode(raft_pb2_grpc.RaftServiceServicer, chess_pb2_grpc.LockServiceServicer):
    """
    Raft consensus node capable of leader election, heartbeat propagation,
    and gating centralized coordination (Lock Service) behind active leadership.
    """

    def __init__(self, node_id):
        self.id = node_id
        self.peers = {n: addr for n, addr in ALL_NODES.items() if n != node_id}
        self.lock = threading.Lock()
        self.running = True

        # Raft state
        self.state = "FOLLOWER"
        self.current_term = 0
        self.voted_for = None
        self.leader_id = None
        self.last_heartbeat = time.time()

        # Coordination state (distributed locks managed by leader)
        self.locks = {}

    def log(self, msg):
        print(f"[{self.id} term={self.current_term} {self.state}] {msg}", flush=True)

    def _reset_election_timer(self):
        self.last_heartbeat = time.time()

    def _random_timeout(self):
        return random.uniform(*ELECTION_TIMEOUT_RANGE)

    # -------------------------------------------------------------
    # RAFT RPC HANDLERS
    # -------------------------------------------------------------
    def RequestVote(self, request, context):
        with self.lock:
            # If request has a higher term, immediately step down to Follower
            if request.term > self.current_term:
                self.current_term = request.term
                self.voted_for = None
                self.state = "FOLLOWER"
                self.leader_id = None

            # Grant vote if term matches and haven't voted for someone else in this term
            grant = (request.term >= self.current_term and
                     self.voted_for in (None, request.candidate_id))
            if grant:
                self.voted_for = request.candidate_id
                self._reset_election_timer()
                self.log(f"Voted for {request.candidate_id} (term {request.term})")
            return raft_pb2.VoteReply(term=self.current_term, vote_granted=grant)

    def AppendEntries(self, request, context):
        with self.lock:
            if request.term >= self.current_term:
                self.current_term = request.term
                self.state = "FOLLOWER"
                self.leader_id = request.leader_id
                self._reset_election_timer()
                return raft_pb2.HeartbeatReply(term=self.current_term, success=True)
            return raft_pb2.HeartbeatReply(term=self.current_term, success=False)

    # -------------------------------------------------------------
    # BACKGROUND LOOPS
    # -------------------------------------------------------------
    def _election_watchdog(self):
        while self.running:
            timeout = self._random_timeout()
            elapsed = time.time() - self.last_heartbeat
            while elapsed < timeout and self.running:
                time.sleep(0.05)
                if self.state == "LEADER":
                    break
                elapsed = time.time() - self.last_heartbeat

            if self.running and self.state != "LEADER" and elapsed >= timeout:
                self._start_election()

    def _start_election(self):
        with self.lock:
            self.state = "CANDIDATE"
            self.current_term += 1
            self.voted_for = self.id
            term = self.current_term
            self.leader_id = None
            self._reset_election_timer()
            self.log("Starting election")

        votes = 1  # Vote for self
        for peer_id, addr in self.peers.items():
            try:
                with grpc.insecure_channel(addr) as channel:
                    stub = raft_pb2_grpc.RaftServiceStub(channel)
                    reply = stub.RequestVote(
                        raft_pb2.VoteRequest(term=term, candidate_id=self.id),
                        timeout=1
                    )
                    if reply.vote_granted:
                        votes += 1
                    elif reply.term > term:
                        with self.lock:
                            self.current_term = reply.term
                            self.state = "FOLLOWER"
                            self.voted_for = None
                            self.leader_id = None
                        return
            except grpc.RpcError:
                self.log(f"No response from {peer_id} (may be down)")

        with self.lock:
            # Check if majority achieved
            if self.state == "CANDIDATE" and votes > len(ALL_NODES) // 2:
                self.state = "LEADER"
                self.leader_id = self.id
                self.log(f"*** ELECTED LEADER *** ({votes}/{len(ALL_NODES)} votes)")
            else:
                self.state = "FOLLOWER"
                self.log(f"Election failed ({votes}/{len(ALL_NODES)} votes) - reverting to follower")

    def _heartbeat_loop(self):
        while self.running:
            time.sleep(HEARTBEAT_INTERVAL)
            if self.state != "LEADER":
                continue
            for peer_id, addr in self.peers.items():
                try:
                    with grpc.insecure_channel(addr) as channel:
                        stub = raft_pb2_grpc.RaftServiceStub(channel)
                        stub.AppendEntries(
                            raft_pb2.HeartbeatRequest(term=self.current_term, leader_id=self.id),
                            timeout=1
                        )
                except grpc.RpcError:
                    pass

    # -------------------------------------------------------------
    # GATED COORDINATION LOGIC (STEP 4)
    # -------------------------------------------------------------
    def AcquireLock(self, request, context):
        with self.lock:
            if self.state != "LEADER":
                hint = self.leader_id or "unknown"
                return chess_pb2.LockReply(
                    granted=False,
                    message=f"not-leader,try={hint}"
                )

            # Reached ONLY if this replica is currently the LEADER
            resource = request.resource_id
            if resource not in self.locks:
                self.locks[resource] = None

            if self.locks[resource] is None:
                self.locks[resource] = request.holder_id
                self.log(f"Granted lock on '{resource}' to worker {request.holder_id}")
                return chess_pb2.LockReply(
                    granted=True,
                    message=f"granted by leader {self.id}"
                )
            elif self.locks[resource] == request.holder_id:
                return chess_pb2.LockReply(
                    granted=True,
                    message=f"already held by worker {request.holder_id}"
                )
            else:
                return chess_pb2.LockReply(
                    granted=False,
                    message=f"held by worker {self.locks[resource]}"
                )

    def ReleaseLock(self, request, context):
        with self.lock:
            if self.state != "LEADER":
                hint = self.leader_id or "unknown"
                return chess_pb2.LockReply(
                    granted=False,
                    message=f"not-leader,try={hint}"
                )

            resource = request.resource_id
            if self.locks.get(resource) == request.holder_id:
                self.locks[resource] = None
                self.log(f"Released lock on '{resource}' from worker {request.holder_id}")
                return chess_pb2.LockReply(
                    granted=True,
                    message=f"released on leader {self.id}"
                )
            return chess_pb2.LockReply(
                granted=False,
                message=f"not held by worker {request.holder_id}"
            )


def serve(node_id):
    if node_id not in ALL_NODES:
        print(f"Error: Unknown node_id '{node_id}'. Must be one of {list(ALL_NODES.keys())}")
        sys.exit(1)

    node = RaftNode(node_id)
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=20))

    # Register both Raft consensus and Gated Lock Service on the same gRPC server
    raft_pb2_grpc.add_RaftServiceServicer_to_server(node, server)
    chess_pb2_grpc.add_LockServiceServicer_to_server(node, server)

    port = ALL_NODES[node_id].split(":")[1]
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"RaftNode-{node_id} listening on {ALL_NODES[node_id]} (port {port})", flush=True)

    threading.Thread(target=node._election_watchdog, daemon=True).start()
    threading.Thread(target=node._heartbeat_loop, daemon=True).start()

    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        node.running = False
        server.stop(0)
        print(f"\nRaftNode-{node_id} stopped cleanly.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python raft_node.py <A|B|C>")
        sys.exit(1)
    serve(sys.argv[1].upper())
