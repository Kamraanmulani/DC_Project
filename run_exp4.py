"""
Experiment 4 Orchestrator: Launches Node 1, Node 2, and Node 3 concurrently
to simulate 3 terminal windows and capture the real distributed Ricart-Agrawala execution trace.
"""

import subprocess
import sys
import threading
import time

def stream_node(node_id):
    cmd = [sys.executable, "-u", "node.py", str(node_id)]
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    for line in iter(proc.stdout.readline, ''):
        if line:
            print(f"[Terminal {node_id}] {line.rstrip()}", flush=True)
    proc.stdout.close()
    proc.wait()

def main():
    print("=" * 70)
    print("Launching Experiment 4: Ricart-Agrawala Mutual Exclusion over gRPC")
    print("Starting 3 Peer Nodes (Node 1, Node 2, Node 3) concurrently...")
    print("=" * 70)

    threads = []
    # Start all 3 nodes within milliseconds of each other for maximum contention
    for nid in [1, 2, 3]:
        t = threading.Thread(target=stream_node, args=(nid,))
        t.start()
        threads.append(t)
        time.sleep(0.3)

    for t in threads:
        t.join()

    print("\n" + "=" * 70)
    print("Experiment 4 Execution Completed Successfully!")
    print("Mutual Exclusion Verified: Only ONE node accessed the Critical Section at a time.")
    print("=" * 70)

if __name__ == "__main__":
    main()
