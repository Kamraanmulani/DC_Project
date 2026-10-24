"""
Distributed Computing Lab - Experiment 7
Test Client: Simulates Concurrent Conflicting Writes and Proves Eventual Consistency
Creates a race between two writers targeting different replicas, demonstrates the
immediate inconsistency window, and verifies convergence after gossip completes.
"""

import time
import threading
import grpc

import replica_pb2
import replica_pb2_grpc

REPLICAS = {
    "A": "localhost:60301",
    "B": "localhost:60302",
    "C": "localhost:60303"
}


def save(replica_name, key, content):
    with grpc.insecure_channel(REPLICAS[replica_name]) as channel:
        stub = replica_pb2_grpc.ReplicaServiceStub(channel)
        ack = stub.SaveValue(replica_pb2.ValueUpdate(
            key=key, content=content, lamport_timestamp=0, origin_replica=""
        ))
        print(f"[Client] Saved on Replica-{replica_name}: \"{content}\" "
              f"-> accepted={ack.accepted}, replica_ts={ack.lamport_timestamp}", flush=True)


def read(replica_name, key):
    with grpc.insecure_channel(REPLICAS[replica_name]) as channel:
        stub = replica_pb2_grpc.ReplicaServiceStub(channel)
        state = stub.GetValue(replica_pb2.ValueQuery(key=key))
        return state.content, state.lamport_timestamp, state.origin_replica


def main():
    key = "shared-key-1"
    print("=== Simulating two concurrent writers hitting DIFFERENT replicas ===\n", flush=True)

    t1 = threading.Thread(target=save, args=("A", key, "value-from-writer-1"))
    t2 = threading.Thread(target=save, args=("C", key, "value-from-writer-2"))

    t1.start()
    time.sleep(0.05)  # near-simultaneous, not identical - creates a real race
    t2.start()

    t1.join()
    t2.join()

    print("\n=== Immediately after writes (replicas may still be mid-gossip) ===", flush=True)
    for name in REPLICAS:
        content, ts, origin = read(name, key)
        print(f"Replica-{name}: \"{content}\" (ts={ts}, origin={origin})", flush=True)

    print("\nWaiting 2s for gossip to finish propagating...\n", flush=True)
    time.sleep(2)

    print("=== After convergence window ===", flush=True)
    results = {}
    for name in REPLICAS:
        content, ts, origin = read(name, key)
        results[name] = content
        print(f"Replica-{name}: \"{content}\"", flush=True)

    if len(set(results.values())) == 1:
        print(f"\n*** CONVERGED: all replicas agree on: \"{list(results.values())[0]}\" ***", flush=True)
    else:
        print(f"\n*** NOT YET CONVERGED: {set(results.values())} ***", flush=True)


if __name__ == "__main__":
    main()
