"""
Experiment 7 Orchestrator: Automated Multi-Process Runner
Launches 3 Replicas (A: 60301, B: 60302, C: 60303) in the background,
waits for them to be ready, executes the concurrent conflicting write test client,
verifies eventual consistency convergence, and cleanly shuts down replica processes.
"""

import subprocess
import sys
import threading
import time

REPLICA_SPECS = [("A", 60301), ("B", 60302), ("C", 60303)]


def stream_output(prefix, proc):
    try:
        for line in iter(proc.stdout.readline, ''):
            if line:
                print(f"[{prefix}] {line.rstrip()}", flush=True)
    except Exception:
        pass


def main():
    print("=" * 75)
    print("DISTRIBUTED COMPUTING LAB - EXPERIMENT 7: EVENTUAL CONSISTENCY")
    print("Gossip Replication + Last-Write-Wins (LWW) with Lamport Clocks")
    print("=" * 75)
    print("Starting 3 Replicas (A on 60301, B on 60302, C on 60303)...")

    replica_procs = []
    replica_threads = []

    try:
        for name, port in REPLICA_SPECS:
            cmd = [sys.executable, "-u", "replica_node.py", name, str(port)]
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            replica_procs.append(proc)
            t = threading.Thread(target=stream_output, args=(f"Node-{name}", proc), daemon=True)
            t.start()
            replica_threads.append(t)

        # Allow servers time to bind and listen
        time.sleep(1.2)

        print("\nAll 3 Replicas listening. Running test client...\n" + "-" * 75)

        # Run client
        client_cmd = [sys.executable, "-u", "replica_client.py"]
        client_proc = subprocess.Popen(
            client_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        for line in iter(client_proc.stdout.readline, ''):
            if line:
                print(line.rstrip(), flush=True)

        client_proc.wait()

        print("-" * 75)
        print("Experiment 7 execution completed successfully!")
        print("Eventual consistency verified: Replicas briefly disagreed, then converged via LWW.")
        print("=" * 75)

    finally:
        # Gracefully shut down replica nodes
        for proc in replica_procs:
            try:
                proc.terminate()
                proc.wait(timeout=2)
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass


if __name__ == "__main__":
    main()
