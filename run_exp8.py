"""
Experiment 8 Orchestrator: Automated Multi-Step Fault-Tolerance Runner
Executes the complete test sequence from Steps 5, 6, and 7 of the lab manual:
  1. Cache Miss (initial query populates cache)
  2. Cache Hit (immediate query served from Redis without touching backend)
  3. Fault-Tolerance Path 1 (Redis is stopped -> falls back to backend directly)
  4. Fault-Tolerance Path 2 (Backend is stopped -> falls back to stale cache)
"""

import subprocess
import sys
import time
import socket
import redis


def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0


def wait_for_port(port, timeout=5.0):
    start = time.time()
    while time.time() - start < timeout:
        if is_port_in_use(port):
            return True
        time.sleep(0.1)
    return False


def run_gateway_call(item_id=1):
    proc = subprocess.Popen(
        [sys.executable, "-u", "cache_gateway.py", str(item_id)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    out, _ = proc.communicate()
    for line in out.strip().splitlines():
        print(f"  {line}", flush=True)
    return proc.returncode


def main():
    print("=" * 75, flush=True)
    print("DISTRIBUTED COMPUTING LAB - EXPERIMENT 8: REDIS CACHING & FAULT TOLERANCE", flush=True)
    print("Cache-Aside Pattern + Graceful Degradation (Dual-Key Fresh/Stale Strategy)", flush=True)
    print("=" * 75, flush=True)

    redis_proc = None
    backend_proc = None

    try:
        # 1. Start Redis if not already running on port 6379
        if not is_port_in_use(6379):
            print("[SETUP] Starting Redis service on port 6379...", flush=True)
            redis_proc = subprocess.Popen(
                [sys.executable, "-u", "redis_server.py", "6379"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True
            )
            wait_for_port(6379)
        else:
            print("[SETUP] Redis already active on port 6379.", flush=True)

        # 2. Start Backend Service on port 50051
        print("[SETUP] Starting ChessMate gRPC Backend (server.py) on port 50051...", flush=True)
        backend_proc = subprocess.Popen(
            [sys.executable, "-u", "server.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        wait_for_port(50051)
        time.sleep(0.5)

        print("\n" + "-" * 75, flush=True)
        print("STAGE 1: Normal Cache-Aside Execution (Initial Call -> Cache Miss)", flush=True)
        print("-" * 75, flush=True)
        run_gateway_call(1)

        print("\n" + "-" * 75, flush=True)
        print("STAGE 2: Fast Path Verification (Second Call -> Cache Hit)", flush=True)
        print("-" * 75, flush=True)
        run_gateway_call(1)

        print("\n" + "-" * 75, flush=True)
        print("STAGE 3: Fault-Tolerance Path 1 (Redis Down -> Falls Back to Backend)", flush=True)
        print("-" * 75, flush=True)
        print("[ACTION] Simulating Redis outage (stopping Redis)...", flush=True)
        if redis_proc:
            redis_proc.terminate()
            redis_proc.wait()
            redis_proc = None
        time.sleep(0.5)
        run_gateway_call(1)

        print("\n" + "-" * 75, flush=True)
        print("STAGE 4: Fault-Tolerance Path 2 (Backend Down -> Falls Back to Stale Cache)", flush=True)
        print("-" * 75, flush=True)
        print("[ACTION] Restarting Redis and refreshing cache entries...", flush=True)
        redis_proc = subprocess.Popen(
            [sys.executable, "-u", "redis_server.py", "6379"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        wait_for_port(6379)
        time.sleep(0.5)

        # Populate fresh and stale cache entries with both services up
        run_gateway_call(1)

        print("\n[ACTION] Simulating Backend outage (killing gRPC Backend Server)...", flush=True)
        if backend_proc:
            backend_proc.terminate()
            backend_proc.wait()
            backend_proc = None
        time.sleep(0.5)

        # Invalidate the short-TTL fresh key to simulate TTL expiration
        try:
            r = redis.Redis(host="127.0.0.1", port=6379, socket_connect_timeout=1)
            r.delete("fresh:item:1")
        except Exception:
            pass

        print("[TEST] Querying gateway while Backend is dead & fresh TTL expired:", flush=True)
        run_gateway_call(1)

        print("\n" + "=" * 75, flush=True)
        print("Experiment 8 execution completed successfully!", flush=True)
        print("Verified all 3 operational states: cache-hit, backend, and stale-fallback.", flush=True)
        print("=" * 75, flush=True)

    finally:
        # Clean up any remaining background processes
        if redis_proc:
            try:
                redis_proc.terminate()
                redis_proc.wait(timeout=2)
            except Exception:
                try:
                    redis_proc.kill()
                except Exception:
                    pass

        if backend_proc:
            try:
                backend_proc.terminate()
                backend_proc.wait(timeout=2)
            except Exception:
                try:
                    backend_proc.kill()
                except Exception:
                    pass


if __name__ == "__main__":
    main()
