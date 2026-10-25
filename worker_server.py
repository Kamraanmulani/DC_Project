import sys
import time
import random
from concurrent import futures
import grpc
import service_pb2
import service_pb2_grpc


class WorkerServer(service_pb2_grpc.WorkerServiceServicer):
    def __init__(self, port):
        self.port = port

    def HandleRequest(self, request, context):
        print(f"[Worker :{self.port}] Handling request {request.request_id}...", flush=True)
        # Simulate variable compute processing time (e.g. 0.2s - 0.8s)
        time.sleep(random.uniform(0.2, 0.8))
        print(f"[Worker :{self.port}] Completed request {request.request_id}.", flush=True)
        return service_pb2.WorkReply(
            request_id=request.request_id,
            handled_by=f"Worker on port {self.port}",
            status="success"
        )


def serve(port):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=20))
    service_pb2_grpc.add_WorkerServiceServicer_to_server(WorkerServer(port), server)
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"WorkerServer listening on port {port}...", flush=True)
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        server.stop(0)
        print(f"\nWorkerServer :{port} stopped cleanly.")


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 60201
    serve(port)
