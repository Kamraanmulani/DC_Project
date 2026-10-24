"""
DC Lab - Experiment 5: Worker Process (AutoSave vs Final Submission)
Demonstrates competing resource requests causing deadlocks and recovery via retry.
"""

import sys
import time
import grpc

try:
    import artwork_pb2
    import artwork_pb2_grpc
except ImportError:
    import chess_pb2 as artwork_pb2
    import chess_pb2_grpc as artwork_pb2_grpc


def acquire(stub, resource, holder, ts):
    reply = stub.AcquireLock(
        artwork_pb2.LockRequest(resource_id=resource, holder_id=holder, timestamp=ts)
    )
    print(f"Node-{holder}: '{resource}' -> granted={reply.granted} ({reply.message})")
    return reply.granted


def release(stub, resource, holder):
    stub.ReleaseLock(
        artwork_pb2.LockRequest(resource_id=resource, holder_id=holder, timestamp=0)
    )


def run(node_id, first, second):
    ts = node_id
    with grpc.insecure_channel("localhost:60100") as channel:
        stub = artwork_pb2_grpc.LockServiceStub(channel)
        held = []

        if acquire(stub, first, node_id, ts):
            held.append(first)
            time.sleep(1.5)  # widens the window for a deadlock to actually form

            if acquire(stub, second, node_id, ts):
                held.append(second)
            else:
                print(f"Node-{node_id}: ABORTED -- releasing held locks and retrying")
                for r in held:
                    release(stub, r, node_id)
                held = []
                time.sleep(1.0)  # Backoff before retrying

                if acquire(stub, second, node_id, ts):
                    held.append(second)
                if acquire(stub, first, node_id, ts):
                    held.append(first)

            time.sleep(0.5)
            for r in held:
                release(stub, r, node_id)
            print(f"Node-{node_id}: DONE")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python worker.py <node_id> <autosave|submission>")
        sys.exit(1)

    node_id, role = int(sys.argv[1]), sys.argv[2].lower()
    if role == "autosave":
        run(node_id, "draft", "submission")
    else:
        run(node_id, "submission", "draft")
