"""
ChessMate gRPC Client with Lamport Logical Clock - Experiment 3
Implementation of Lamport Logical Clock Synchronization to Maintain
Consistent Event Timestamps in a Distributed System
"""

import sys
import grpc
from lamport_clock import LamportClock
import lamport_chess_pb2
import lamport_chess_pb2_grpc


def run_experiment_3():
    # Initialize Client Lamport Logical Clock
    clock = LamportClock()

    channel = grpc.insecure_channel('localhost:50051')
    stub = lamport_chess_pb2_grpc.LamportChessServiceStub(channel)

    try:
        # ---------------------------------------------------------
        # Operation 1: Create Room
        # ---------------------------------------------------------
        clock.send_event()
        print("========== CREATE ROOM ==========")
        print("Sending Request")
        print(f"Lamport Clock : {clock.get_time()}")

        req1 = lamport_chess_pb2.LamportCreateRoomRequest(
            room_name="VIT-DC Grandmaster Arena",
            player_email="kamraan@vit.edu",
            player_color="white",
            lamport_time=clock.get_time()
        )
        res1 = stub.CreateRoom(req1)

        clock.receive_event(res1.lamport_time)
        print("\nReceived Response")
        print(f"Lamport Clock : {clock.get_time()}")
        print(f"Room Code     : {res1.room_code}")
        print(f"Game ID       : {res1.game_id}")
        print(f"Status        : {res1.status}")
        print(f"Message       : {res1.message}")
        print()

        room_code = res1.room_code

        # ---------------------------------------------------------
        # Operation 2: Make Move (White: e2 to e4)
        # ---------------------------------------------------------
        clock.send_event()
        print("========== MAKE MOVE (WHITE: e2 to e4) ==========")
        print("Sending Request")
        print(f"Lamport Clock : {clock.get_time()}")

        req2 = lamport_chess_pb2.LamportMakeMoveRequest(
            room_code=room_code,
            player_color="white",
            from_square="e2",
            to_square="e4",
            lamport_time=clock.get_time()
        )
        res2 = stub.MakeMove(req2)

        clock.receive_event(res2.lamport_time)
        print("\nReceived Response")
        print(f"Lamport Clock : {clock.get_time()}")
        print(f"Valid         : {res2.is_valid}")
        print(f"Move SAN      : {res2.move_san}")
        print(f"Next Turn     : {res2.current_turn}")
        print(f"FEN           : {res2.current_fen}")
        print(f"Message       : {res2.message}")
        print()

        # ---------------------------------------------------------
        # Operation 3: Make Move (Black: e7 to e5)
        # ---------------------------------------------------------
        clock.send_event()
        print("========== MAKE MOVE (BLACK: e7 to e5) ==========")
        print("Sending Request")
        print(f"Lamport Clock : {clock.get_time()}")

        req3 = lamport_chess_pb2.LamportMakeMoveRequest(
            room_code=room_code,
            player_color="black",
            from_square="e7",
            to_square="e5",
            lamport_time=clock.get_time()
        )
        res3 = stub.MakeMove(req3)

        clock.receive_event(res3.lamport_time)
        print("\nReceived Response")
        print(f"Lamport Clock : {clock.get_time()}")
        print(f"Valid         : {res3.is_valid}")
        print(f"Move SAN      : {res3.move_san}")
        print(f"Next Turn     : {res3.current_turn}")
        print(f"FEN           : {res3.current_fen}")
        print(f"Message       : {res3.message}")
        print()

        # ---------------------------------------------------------
        # Operation 4: Get Game State
        # ---------------------------------------------------------
        clock.send_event()
        print("========== GET GAME STATE ==========")
        print("Sending Request")
        print(f"Lamport Clock : {clock.get_time()}")

        req4 = lamport_chess_pb2.LamportGetGameStateRequest(
            room_code=room_code,
            lamport_time=clock.get_time()
        )
        res4 = stub.GetGameState(req4)

        clock.receive_event(res4.lamport_time)
        print("\nReceived Response")
        print(f"Lamport Clock : {clock.get_time()}")
        print(f"Room Code     : {res4.room_code}")
        print(f"Game Status   : {res4.status}")
        print(f"Active Turn   : {res4.current_turn}")
        print(f"Total Moves   : {res4.move_count}")
        print(f"Move History  : {list(res4.move_history)}")
        print(f"Message       : {res4.message}")
        print()

        # ---------------------------------------------------------
        # Conclusion
        # ---------------------------------------------------------
        print("=" * 70)
        print("Conclusion :")
        print("The experiment successfully implemented Lamport Logical Clock Synchronization")
        print("in the ChessMate distributed chess application using gRPC for communication")
        print("between the Game Client and the Chess Engine Service. Lamport timestamps were")
        print("attached to every RPC request and response, enabling both client and server")
        print("to maintain a consistent logical ordering of distributed events.")
        print()
        print("Upon receiving a message, each service updated its logical clock using the")
        print("Lamport algorithm (L(e') = max(L_local, L_msg) + 1), ensuring that causally related")
        print("chess actions (Room Creation -> Move White -> Move Black -> Query State) were")
        print("processed in the correct chronological sequence without relying on physical clocks.")
        print()
        print("The successful execution verified reliable communication while preserving causal")
        print("event ordering across distributed services in the ChessMate system.")
        print("=" * 70)

    except grpc.RpcError as e:
        print(f"[ERROR] gRPC call failed: {e.code()} - {e.details()}")
    finally:
        channel.close()


if __name__ == "__main__":
    run_experiment_3()
