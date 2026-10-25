import subprocess
import time
import sys
import socket

WORKER_PORTS = [60201, 60202, 60203]


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
    print("DISTRIBUTED COMPUTING LAB - EXPERIMENT 6: LOAD BALANCING (LEAST CONNECTIONS)")
    print("=" * 75)

    processes = []
    print("\n[SETUP] Starting 3 Worker Backends (60201, 60202, 60203)...")
    for port in WORKER_PORTS:
        proc = subprocess.Popen(
            [sys.executable, "-u", "worker_server.py", str(port)],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        processes.append(proc)

    for port in WORKER_PORTS:
        if not wait_for_port("127.0.0.1", port, timeout=5.0):
            print(f"Error: Worker on port {port} failed to start.")
            for p in processes:
                p.terminate()
            sys.exit(1)
        print(f"  [Worker] Online and listening on 127.0.0.1:{port}")

    print("\n[LB TEST] Launching Load Balancer Client...")
    lb_proc = subprocess.run([sys.executable, "-u", "load_balancer.py"], capture_output=True, text=True)
    print(lb_proc.stdout)

    print("\n[CLEANUP] Stopping workers...")
    for p in processes:
        p.terminate()
        try:
            p.wait(timeout=1.0)
        except subprocess.TimeoutExpired:
            p.kill()

    print("Experiment 6 execution completed successfully!")


if __name__ == "__main__":
    main()
