import time
import threading
from concurrent.futures import ThreadPoolExecutor
import grpc
import service_pb2
import service_pb2_grpc

BACKENDS = [
    "127.0.0.1:60201",
    "127.0.0.1:60202",
    "127.0.0.1:60203",
]

active_connections = [0] * len(BACKENDS)
lock = threading.Lock()


def pick_least_connections():
    with lock:
        idx = active_connections.index(min(active_connections))
        active_connections[idx] += 1
        return idx


def release(idx):
    with lock:
        active_connections[idx] -= 1


def forward_request(req_id):
    idx = pick_least_connections()
    target = BACKENDS[idx]
    with lock:
        counts = list(active_connections)
    print(f"[LB] Routing request #{req_id} -> {target} (active connections now: {counts})", flush=True)

    try:
        with grpc.insecure_channel(target) as ch:
            stub = service_pb2_grpc.WorkerServiceStub(ch)
            reply = stub.HandleRequest(service_pb2.WorkRequest(request_id=req_id), timeout=5)
            return reply
    except Exception as e:
        print(f"[LB] Request #{req_id} failed on {target}: {e}", flush=True)
        return None
    finally:
        release(idx)
        with lock:
            counts = list(active_connections)
        print(f"[LB] Released {target} after req #{req_id} (active connections now: {counts})", flush=True)


def main():
    print(f"[LB] Load Balancer starting. Backends: {BACKENDS}")
    print("[LB] Dispatching 12 asynchronous requests using Least Connections...")

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = [executor.submit(forward_request, i + 1) for i in range(12)]
        for f in futures:
            f.result()

    print("[LB] All requests processed.")
    print(f"[LB] Final active connection counts (should all be 0): {active_connections}")


if __name__ == "__main__":
    main()
