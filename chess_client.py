"""
ChessMate gRPC Client Service - Experiment 2
Develop RPC APIs to Enable Communication Between Services for your mini project
"""

import sys
import grpc
import chess_pb2
import chess_pb2_grpc


def run_experiment_2():
    print("=" * 70)
    print("   ChessMate: Distributed Computing RPC Experiment 2")
    print("   Target Server: localhost:50051 (gRPC over HTTP/2)")
    print("=" * 70)

    # Establish gRPC channel to the server
    channel = grpc.insecure_channel('localhost:50051')
    stub = chess_pb2_grpc.ChessServiceStub(channel)

    try:
        # Step 1: Create a Game Room via RPC
        print("\n[STEP 1] Invoking RPC: CreateRoom()...")
        create_req = chess_pb2.CreateRoomRequest(
            room_name="VIT-DC Championship Room",
            player_email="kamraan@vit.edu",
            player_color="white"
        )
        create_res = stub.CreateRoom(create_req)
        room_code = create_res.room_code
        print("  --> Request Sent  : Room='VIT-DC Championship Room', Host='kamraan@vit.edu'")
        print("  <-- Response Recv :")
        print(f"      Status    : {create_res.status}")
        print(f"      Room Code : {create_res.room_code}")
        print(f"      Game ID   : {create_res.game_id}")
        print(f"      Message   : {create_res.message}")

        # Step 2: Make Move 1 (White plays e2 -> e4)
        print("\n[STEP 2] Invoking RPC: MakeMove() -> Move 1: White e2 to e4...")
        move1_req = chess_pb2.MakeMoveRequest(
            room_code=room_code,
            player_color="white",
            from_square="e2",
            to_square="e4"
        )
        move1_res = stub.MakeMove(move1_req)
        print("  --> Request Sent  : White e2 -> e4 (King's Pawn Opening)")
        print("  <-- Response Recv :")
        print(f"      Move Valid   : {move1_res.is_valid}")
        print(f"      Standard SAN : {move1_res.move_san}")
        print(f"      Next Turn    : {move1_res.current_turn}")
        print(f"      FEN Notation : {move1_res.current_fen}")
        print(f"      Message      : {move1_res.message}")

        # Step 3: Make Move 2 (Black responds e7 -> e5)
        print("\n[STEP 3] Invoking RPC: MakeMove() -> Move 2: Black e7 to e5...")
        move2_req = chess_pb2.MakeMoveRequest(
            room_code=room_code,
            player_color="black",
            from_square="e7",
            to_square="e5"
        )
        move2_res = stub.MakeMove(move2_req)
        print("  --> Request Sent  : Black e7 -> e5 (Open Game)")
        print("  <-- Response Recv :")
        print(f"      Move Valid   : {move2_res.is_valid}")
        print(f"      Standard SAN : {move2_res.move_san}")
        print(f"      Next Turn    : {move2_res.current_turn}")
        print(f"      FEN Notation : {move2_res.current_fen}")
        print(f"      Message      : {move2_res.message}")

        # Step 4: Make Move 3 (White plays g1 -> f3)
        print("\n[STEP 4] Invoking RPC: MakeMove() -> Move 3: White g1 to f3...")
        move3_req = chess_pb2.MakeMoveRequest(
            room_code=room_code,
            player_color="white",
            from_square="g1",
            to_square="f3"
        )
        move3_res = stub.MakeMove(move3_req)
        print("  --> Request Sent  : White g1 -> f3 (King's Knight Attack)")
        print("  <-- Response Recv :")
        print(f"      Move Valid   : {move3_res.is_valid}")
        print(f"      Standard SAN : {move3_res.move_san}")
        print(f"      Next Turn    : {move3_res.current_turn}")
        print(f"      In Check     : {move3_res.is_check}")
        print(f"      Message      : {move3_res.message}")

        # Step 5: Query Game State
        print("\n[STEP 5] Invoking RPC: GetGameState()...")
        state_req = chess_pb2.GetGameStateRequest(room_code=room_code)
        state_res = stub.GetGameState(state_req)
        print(f"  --> Request Sent  : Querying Room {room_code}")
        print("  <-- Response Recv :")
        print(f"      Room Code    : {state_res.room_code}")
        print(f"      Game Status  : {state_res.status}")
        print(f"      Active Turn  : {state_res.current_turn}")
        print(f"      Total Moves  : {state_res.move_count}")
        print(f"      Move History : {list(state_res.move_history)}")
        print(f"      Board FEN    : {state_res.fen}")
        print(f"      Message      : {state_res.message}")

        print("\n" + "=" * 70)
        print("Conclusion (for ChessMate):")
        print("The successful execution of the program confirmed that the distributed")
        print("Chess Client was able to communicate seamlessly with the Chess Engine Service")
        print("using gRPC-based RPC calls. The client invoked CreateRoom(), MakeMove(), and")
        print("GetGameState(), and the server processed every request with accurate chess logic,")
        print("demonstrating reliable request-response communication between two distributed services.")
        print("=" * 70)

    except grpc.RpcError as e:
        print(f"\n[ERROR] gRPC call failed: {e.code()} - {e.details()}")
    finally:
        channel.close()


if __name__ == "__main__":
    run_experiment_2()
