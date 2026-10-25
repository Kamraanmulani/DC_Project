import sys
import grpc
import chess_pb2
import chess_pb2_grpc

ALL_NODES = {
    "A": "127.0.0.1:60401",
    "B": "127.0.0.1:60402",
    "C": "127.0.0.1:60403",
}


def acquire_lock_from_node(target_node, resource_id="board_evaluator", holder_id=101, follow_redirect=True):
    target_node = target_node.upper()
    if target_node not in ALL_NODES:
        print(f"[Client] Error: Unknown node '{target_node}'")
        return False, None

    addr = ALL_NODES[target_node]
    print(f"\n[Client] Sending AcquireLock('{resource_id}', holder={holder_id}) to Node-{target_node} ({addr})...")

    try:
        with grpc.insecure_channel(addr) as channel:
            stub = chess_pb2_grpc.LockServiceStub(channel)
            reply = stub.AcquireLock(
                chess_pb2.LockRequest(resource_id=resource_id, holder_id=holder_id, timestamp=1),
                timeout=2
            )
            print(f"[Client] Response from Node-{target_node}: granted={reply.granted}, message='{reply.message}'")

            if not reply.granted and "not-leader,try=" in reply.message and follow_redirect:
                leader_hint = reply.message.split("not-leader,try=")[1].strip()
                if leader_hint in ALL_NODES and leader_hint != target_node:
                    print(f"[Client] -> Following redirect hint to current leader: Node-{leader_hint}")
                    return acquire_lock_from_node(leader_hint, resource_id, holder_id, follow_redirect=False)

            return reply.granted, reply.message
    except grpc.RpcError as e:
        print(f"[Client] Failed to reach Node-{target_node}: {e.code()}")
        return False, str(e.code())


if __name__ == "__main__":
    node = sys.argv[1] if len(sys.argv) > 1 else "A"
    res = sys.argv[2] if len(sys.argv) > 2 else "championship_slot"
    holder = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    acquire_lock_from_node(node, res, holder)
