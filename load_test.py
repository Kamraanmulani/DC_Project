import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import Counter
import grpc
import service_pb2
import service_pb2_grpc

# In Kubernetes, headless service DNS is 'dns:///worker:60201'.
# Locally, default fallback is '127.0.0.1:60201'.
DEFAULT_ADDR = "dns:///worker:60201" if os.environ.get("RUN_ENV") == "docker" else "127.0.0.1:60201"
TARGET_ADDR = os.environ.get("TARGET_ADDR", DEFAULT_ADDR)

TOTAL_REQUESTS = int(os.environ.get("NUM_REQUESTS", "20"))
CONCURRENCY = int(os.environ.get("CONCURRENCY", "5"))


def send_request(request_id, channel):
    stub = service_pb2_grpc.WorkerServiceStub(channel)
    start_time = time.time()
    try:
        response = stub.HandleRequest(
            service_pb2.WorkRequest(request_id=request_id),
            timeout=5
        )
        duration = round(time.time() - start_time, 3)
        worker = response.handled_by if hasattr(response, 'handled_by') and response.handled_by else "unknown"
        print(f"  [Req #{request_id:02d}] Handled by: {worker} in {duration}s -> status: {response.status}", flush=True)
        return True, worker, duration
    except grpc.RpcError as e:
        duration = round(time.time() - start_time, 3)
        print(f"  [Req #{request_id:02d}] FAILED ({e.code()}) in {duration}s", flush=True)
        return False, "ERROR", duration


def run_load_test():
    print("=" * 75)
    print(f"CHESSMATE DISTRIBUTED LOAD SIMULATOR (Kubernetes Exp 10)")
    print(f"Target Service Address: {TARGET_ADDR}")
    print(f"Total Requests: {TOTAL_REQUESTS} | Concurrency: {CONCURRENCY}")
    print("=" * 75)

    # Enable gRPC client-side Round Robin load balancing across all resolved pod IPs
    channel_options = [
        ("grpc.lb_policy_name", "round_robin"),
        ("grpc.service_config", '{"loadBalancingConfig": [{"round_robin": {}}]}')
    ]

    print(f"\n[CLIENT] Establishing gRPC channel with Round Robin policy...")
    with grpc.insecure_channel(TARGET_ADDR, options=channel_options) as channel:
        start_total = time.time()
        results = []

        with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
            future_to_id = {
                executor.submit(send_request, i + 1, channel): i + 1
                for i in range(TOTAL_REQUESTS)
            }
            for future in as_completed(future_to_id):
                results.append(future.result())

        total_elapsed = round(time.time() - start_total, 3)

    successes = sum(1 for success, _, _ in results if success)
    failures = TOTAL_REQUESTS - successes
    worker_counts = Counter(worker for success, worker, _ in results if success)

    print("\n" + "=" * 75)
    print("LOAD TEST EXECUTION SUMMARY")
    print("=" * 75)
    print(f"Total Requests Sent : {TOTAL_REQUESTS}")
    print(f"Successful Requests : {successes} ({round(successes / TOTAL_REQUESTS * 100, 1)}%)")
    print(f"Failed Requests     : {failures}")
    print(f"Total Test Time     : {total_elapsed}s")
    print(f"Throughput          : {round(TOTAL_REQUESTS / total_elapsed, 2)} req/sec")

    print("\n[REPLICA LOAD DISTRIBUTION]")
    for worker, count in sorted(worker_counts.items()):
        percentage = round(count / successes * 100, 1) if successes > 0 else 0
        bar = "#" * int(percentage // 3)
        print(f"  Worker {worker:15s}: {count:2d} requests ({percentage:5.1f}%) | {bar}")

    if len(worker_counts) > 1:
        print("\n[VERIFICATION PASS] Traffic is actively spread across multiple replicas!")
        print("Avoided the gRPC single-connection trap via Headless Service + round_robin policy.")
    elif successes > 0:
        print("\n[NOTE] Single endpoint target detected; all requests handled by 1 worker.")
    print("=" * 75)


if __name__ == "__main__":
    run_load_test()
