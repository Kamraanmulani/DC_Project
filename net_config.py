import os

# RUN_ENV can be "local" (standalone processes) or "docker" / "k8s" (Kubernetes pod network)
RUN_ENV = os.environ.get("RUN_ENV", "local").lower()

LOCAL_HOSTS = {
    "worker": "127.0.0.1:60201",
    "worker-1": "127.0.0.1:60201",
    "worker-2": "127.0.0.1:60202",
    "worker-3": "127.0.0.1:60203",
    "raft-a": "127.0.0.1:60401",
    "raft-b": "127.0.0.1:60402",
    "raft-c": "127.0.0.1:60403",
    "chess-backend": "127.0.0.1:50051",
    "redis": "127.0.0.1:6379",
    "dfs-meta": "127.0.0.1:60501",
    "dfs-store-1": "127.0.0.1:60511",
    "dfs-store-2": "127.0.0.1:60512",
    "dfs-store-3": "127.0.0.1:60513",
}

# In Kubernetes, each Service metadata name resolves via CoreDNS to pod IP(s)
DOCKER_HOSTS = {
    "worker": "worker:60201",
    "worker-1": "worker:60201",
    "worker-2": "worker:60201",
    "worker-3": "worker:60201",
    "raft-a": "raft-a:60401",
    "raft-b": "raft-b:60402",
    "raft-c": "raft-c:60403",
    "chess-backend": "chess-backend:50051",
    "redis": "redis:6379",
    "dfs-meta": "dfs-meta:60501",
    "dfs-store-1": "dfs-store-1:60511",
    "dfs-store-2": "dfs-store-2:60512",
    "dfs-store-3": "dfs-store-3:60513",
}


def resolve(name):
    """
    Resolves a service name to its network address based on RUN_ENV.
    Allows identical Python code to execute seamlessly both locally and inside Kubernetes pods.
    """
    hosts = DOCKER_HOSTS if RUN_ENV in ("docker", "k8s") else LOCAL_HOSTS
    if name in hosts:
        return hosts[name]
    return f"{name}:50051"
