"""
Distributed Computing Lab - Experiment 8
Redis Caching for Fault Tolerance (Cache-Aside Pattern)
Implements dual-key caching (fresh short-TTL + stale fallback) in front of the
Experiment 2 gRPC Chess Backend service, gracefully handling both Redis and Backend outages.
"""

import json
import sys
import grpc
import redis

import chess_pb2
import chess_pb2_grpc

REDIS_HOST = "127.0.0.1"
REDIS_PORT = 6379
CACHE_TTL_SECONDS = 10  # short TTL so hits/misses are easy to observe

BACKEND_SERVICE_ADDR = "127.0.0.1:50051"

STALE_KEY_PREFIX = "stale:item:"  # kept indefinitely as a fallback, never expires
FRESH_KEY_PREFIX = "fresh:item:"  # normal cache entry, expires after CACHE_TTL_SECONDS


def get_redis():
    """
    Fresh connection per call, with a short timeout, so we can
    detect Redis being down quickly instead of hanging.
    """
    return redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        socket_connect_timeout=1,
        socket_timeout=1
    )


def fetch_from_backend(item_id):
    """Direct call to the real backend service (ChessMate Exp 2 gRPC server)."""
    with grpc.insecure_channel(BACKEND_SERVICE_ADDR) as channel:
        stub = chess_pb2_grpc.ChessServiceStub(channel)
        response = stub.GetGameState(
            chess_pb2.GetGameStateRequest(room_code=str(item_id)),
            timeout=2
        )
        return {
            "room_code": response.room_code,
            "status": response.status,
            "current_turn": response.current_turn,
            "fen": response.fen,
            "move_count": response.move_count,
            "move_history": list(response.move_history),
            "message": response.message
        }


def get_item(item_id):
    fresh_key = f"{FRESH_KEY_PREFIX}{item_id}"
    stale_key = f"{STALE_KEY_PREFIX}{item_id}"

    # --- Try the cache first ---
    try:
        r = get_redis()
        cached = r.get(fresh_key)
        if cached:
            print(f"[Gateway] CACHE HIT for item {item_id}", flush=True)
            return json.loads(cached), "cache-hit"
        print(f"[Gateway] CACHE MISS for item {item_id} -- querying backend", flush=True)
    except redis.exceptions.RedisError as e:
        print(f"[Gateway] REDIS UNAVAILABLE ({e}) -- falling back to backend directly", flush=True)
        r = None

    # --- Cache miss, or Redis itself is down: go to the real backend ---
    try:
        data = fetch_from_backend(item_id)
        print(f"[Gateway] Fetched item {item_id} from BACKEND", flush=True)
        if r is not None:
            try:
                r.set(fresh_key, json.dumps(data), ex=CACHE_TTL_SECONDS)
                r.set(stale_key, json.dumps(data))  # no expiry - fault-tolerance backup
            except redis.exceptions.RedisError:
                print("[Gateway] Redis write failed, continuing without caching this result", flush=True)
        return data, "backend"

    except grpc.RpcError as e:
        # --- Backend unreachable: fall back to a stale cached copy if we have one ---
        print(f"[Gateway] BACKEND UNAVAILABLE ({e.code()}) -- checking for stale cache", flush=True)
        if r is not None:
            try:
                stale = r.get(stale_key)
                if stale:
                    print(f"[Gateway] Serving STALE cached copy for item {item_id}", flush=True)
                    return json.loads(stale), "stale-fallback"
            except redis.exceptions.RedisError:
                pass
        raise RuntimeError(f"Item {item_id} unavailable: both backend and cache failed")


if __name__ == "__main__":
    item_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    data, source = get_item(item_id)
    print(f"\nResult (source={source}): {data}", flush=True)
