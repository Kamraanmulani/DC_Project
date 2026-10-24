"""
Lightweight Redis In-Memory TCP Server (for Experiment 8)
Provides a fully standard Redis TCP endpoint on localhost:6379 using fakeredis.
Allows running and testing Redis caching and fault-tolerance on any platform without external daemons.
"""

import sys
import fakeredis


def run(port=6379):
    print(f"Redis Server listening on 127.0.0.1:{port}...", flush=True)
    server = fakeredis.TcpFakeServer(('127.0.0.1', port))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Redis server...", flush=True)
    finally:
        try:
            server.server_close()
        except Exception:
            pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 6379
    run(port)
