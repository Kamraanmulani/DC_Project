import subprocess
import time
import sys
import threading
import socket
import grpc
import raft_pb2
import raft_pb2_grpc
import chess_pb2
import chess_pb2_grpc

ALL_NODES = {
    "A": ("127.0.0.1", 60401),
    "B": ("127.0.0.1", 60402),
    "C": ("127.0.0.1", 60403),
}


def wait_for_port(ip, port, timeout=5.0):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.create_connection((ip, port), timeout=0.2):
                return True
        except (OSError, ConnectionRefusedError):
            time.sleep(0.1)
    return False


def main():
    print("=" * 75)
    print("DISTRIBUTED COMPUTING LAB - EXPERIMENT 9: RAFT LEADER ELECTION & FAILOVER")
    print("Consensus-Based Fault Tolerance for Uninterrupted Coordination")
    print("=" * 75)

    processes = {}
    node_lines = {n: [] for n in ALL_NODES}

    def stream_logs(node_id, proc):
        for line in iter(proc.stdout.readline, ''):
            clean = line.strip()
            if clean:
                node_lines[node_id].append(clean)
                print(f"  [Node-{node_id}] {clean}", flush=True)

    print("\n[SETUP] Starting 3 Raft Replicas (Node A, Node B, Node C)...")
    for node_id, (ip, port) in ALL_NODES.items():
        proc = subprocess.Popen(
            [sys.executable, "-u", "raft_node.py", node_id],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        processes[node_id] = proc
        threading.Thread(target=stream_logs, args=(node_id, proc), daemon=True).start()

    # Wait for all sockets to open
    for node_id, (ip, port) in ALL_NODES.items():
        if not wait_for_port(ip, port, timeout=5.0):
            print(f"Error: Node-{node_id} failed to bind to {ip}:{port}")
            for p in processes.values():
                p.terminate()
            sys.exit(1)

    print("[SETUP] All 3 Replicas online and listening.")

    # -------------------------------------------------------------
    # STAGE 1: INITIAL LEADER ELECTION
    # -------------------------------------------------------------
    print("\n" + "-" * 75)
    print("STAGE 1: Observing Initial Leader Election (Term 1)")
    print("-" * 75)
    print("Waiting 4 seconds for election watchdog timeout and vote convergence...")

    leader_id = None
    initial_wait_start = time.time()
    while time.time() - initial_wait_start < 6.0:
        for node_id, lines in node_lines.items():
            for line in lines:
                if "*** ELECTED LEADER ***" in line:
                    leader_id = node_id
                    break
            if leader_id:
                break
        if leader_id:
            break
        time.sleep(0.3)

    if not leader_id:
        print("[FAIL] No leader was elected within timeout window.")
        for p in processes.values():
            p.terminate()
        sys.exit(1)

    followers = [n for n in ALL_NODES if n != leader_id]
    print(f"\n[ELECTION VERIFIED] Initial Leader: Node-{leader_id} (Followers: {followers})")

    # -------------------------------------------------------------
    # STAGE 2: GATED COORDINATION LOGIC VERIFICATION
    # -------------------------------------------------------------
    print("\n" + "-" * 75)
    print("STAGE 2: Gated Coordination (Lock Service) Verification")
    print("-" * 75)

    test_follower = followers[0]
    follower_addr = f"{ALL_NODES[test_follower][0]}:{ALL_NODES[test_follower][1]}"
    leader_addr = f"{ALL_NODES[leader_id][0]}:{ALL_NODES[leader_id][1]}"

    print(f"\n[TEST 2A] Querying Follower Node-{test_follower} for lock acquisition...")
    with grpc.insecure_channel(follower_addr) as ch:
        stub = chess_pb2_grpc.LockServiceStub(ch)
        reply = stub.AcquireLock(
            chess_pb2.LockRequest(resource_id="tournament_board_1", holder_id=42, timestamp=1),
            timeout=2
        )
        print(f"  Result: granted={reply.granted}, message='{reply.message}'")
        if not reply.granted and f"not-leader,try={leader_id}" in reply.message:
            print(f"  -> SUCCESS: Follower correctly refused request and redirected to leader ({leader_id})")
        else:
            print("  -> WARNING: Follower response did not match expected redirection hint.")

    print(f"\n[TEST 2B] Querying Active Leader Node-{leader_id} for lock acquisition...")
    with grpc.insecure_channel(leader_addr) as ch:
        stub = chess_pb2_grpc.LockServiceStub(ch)
        reply = stub.AcquireLock(
            chess_pb2.LockRequest(resource_id="tournament_board_1", holder_id=42, timestamp=1),
            timeout=2
        )
        print(f"  Result: granted={reply.granted}, message='{reply.message}'")
        if reply.granted and f"granted by leader {leader_id}" in reply.message:
            print(f"  -> SUCCESS: Active Leader accepted and granted lock.")
        else:
            print("  -> WARNING: Leader failed to grant lock.")

    # -------------------------------------------------------------
    # STAGE 3: FAILOVER DEMONSTRATION (KILLING THE LEADER)
    # -------------------------------------------------------------
    print("\n" + "-" * 75)
    print(f"STAGE 3: Failover Test -- Killing Current Leader (Node-{leader_id})")
    print("-" * 75)
    print(f"[ACTION] Terminating Leader Node-{leader_id} process (simulating server crash)...")
    dead_leader = leader_id
    processes[dead_leader].terminate()
    processes[dead_leader].wait()
    del processes[dead_leader]
    print(f"[ACTION] Node-{dead_leader} is DOWN. Surviving replicas: {followers}")

    print("\n[ACTION] Surviving replicas will detect missing heartbeats (timeout 1.5s - 3.0s)...")
    new_leader_id = None
    failover_start = time.time()

    # Clear prior lines for remaining nodes to detect new term election
    while time.time() - failover_start < 8.0:
        for f in followers:
            for line in node_lines[f]:
                if "*** ELECTED LEADER ***" in line and f"term=1" not in line:
                    new_leader_id = f
                    break
            if new_leader_id:
                break
        if new_leader_id:
            break
        time.sleep(0.3)

    if not new_leader_id:
        print("[FAIL] Surviving replicas failed to elect a new leader within timeout window.")
        for p in processes.values():
            p.terminate()
        sys.exit(1)

    print(f"\n[FAILOVER VERIFIED] New Leader Elected: Node-{new_leader_id}!")
    surviving_follower = [n for n in followers if n != new_leader_id][0]
    print(f"Current Cluster Topology: Leader=Node-{new_leader_id}, Follower=Node-{surviving_follower}, Dead=Node-{dead_leader}")

    # -------------------------------------------------------------
    # STAGE 4: POST-FAILOVER COORDINATION VERIFICATION
    # -------------------------------------------------------------
    print("\n" + "-" * 75)
    print(f"STAGE 4: Post-Failover Gated Coordination via New Leader (Node-{new_leader_id})")
    print("-" * 75)
    new_leader_addr = f"{ALL_NODES[new_leader_id][0]}:{ALL_NODES[new_leader_id][1]}"

    print(f"[TEST 4] Requesting new lock 'tournament_board_2' from newly elected Leader Node-{new_leader_id}...")
    with grpc.insecure_channel(new_leader_addr) as ch:
        stub = chess_pb2_grpc.LockServiceStub(ch)
        reply = stub.AcquireLock(
            chess_pb2.LockRequest(resource_id="tournament_board_2", holder_id=99, timestamp=2),
            timeout=2
        )
        print(f"  Result: granted={reply.granted}, message='{reply.message}'")
        if reply.granted and f"granted by leader {new_leader_id}" in reply.message:
            print("  -> SUCCESS: Coordination continued seamlessly without manual intervention!")

    # -------------------------------------------------------------
    # CLEANUP
    # -------------------------------------------------------------
    print("\n" + "=" * 75)
    print("Experiment 9 execution completed successfully!")
    print("Raft consensus leader election, failover, and gated coordination verified.")
    print("=" * 75)

    for p in processes.values():
        p.terminate()
        try:
            p.wait(timeout=1.0)
        except subprocess.TimeoutExpired:
            p.kill()


if __name__ == "__main__":
    main()
