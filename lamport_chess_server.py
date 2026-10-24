"""
ChessMate gRPC Server with Lamport Logical Clock - Experiment 3
Implementation of Lamport Logical Clock Synchronization to Maintain
Consistent Event Timestamps in a Distributed System
"""

import sys
import time
import random
import concurrent.futures as futures
import grpc
import chess

from lamport_clock import LamportClock
import lamport_chess_pb2
import lamport_chess_pb2_grpc


class LamportChessService(lamport_chess_pb2_grpc.LamportChessServiceServicer):
    def __init__(self):
        self.rooms = {}
        self.clock = LamportClock(initial_time=0)
        print("[SERVER] Initialized ChessMate Game State Manager with Lamport Clock")

    def CreateRoom(self, request, context):
        # Update server Lamport clock on receiving request
        received_time = request.lamport_time
        self.clock.receive_event(received_time)

        print("\n" + "-" * 50)
        print("Received Request: CreateRoom")
        print(f"Room Name       : {request.room_name}")
        print(f"Host Email      : {request.player_email}")
        print(f"Incoming Clock  : {received_time}")
        print(f"Server Clock    : {self.clock.get_time()}")
        print("-" * 50)

        # Generate unique room code
        while True:
            room_code = str(random.randint(100, 999))
            if room_code not in self.rooms:
                break

        game_id = f"game_{int(time.time())}_{random.randint(1000, 9999)}"
        board = chess.Board()

        self.rooms[room_code] = {
            "room_name": request.room_name,
            "host_email": request.player_email,
            "board": board,
            "moves": [],
            "status": "active"
        }

        # Send response with timestamp corresponding to client request time for synchronized step
        return lamport_chess_pb2.LamportCreateRoomResponse(
            room_code=room_code,
            game_id=game_id,
            status="created",
            message=f"Game room '{request.room_name}' initialized successfully with standard 8x8 chessboard.",
            lamport_time=request.lamport_time
        )

    def MakeMove(self, request, context):
        received_time = request.lamport_time
        self.clock.receive_event(received_time)

        print("\n" + "-" * 50)
        print("Received Request: MakeMove")
        print(f"Room Code       : {request.room_code}")
        print(f"Player Color    : {request.player_color}")
        print(f"Move            : {request.from_square} -> {request.to_square}")
        print(f"Incoming Clock  : {received_time}")
        print(f"Server Clock    : {self.clock.get_time()}")
        print("-" * 50)

        room_code = request.room_code
        if room_code not in self.rooms:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details("Room not found")
            return lamport_chess_pb2.LamportMakeMoveResponse(
                is_valid=False,
                message=f"Room {room_code} not found.",
                lamport_time=request.lamport_time
            )

        room = self.rooms[room_code]
        board = room["board"]
        expected_turn = "white" if board.turn == chess.WHITE else "black"

        if request.player_color.lower() != expected_turn:
            return lamport_chess_pb2.LamportMakeMoveResponse(
                is_valid=False,
                current_fen=board.fen(),
                current_turn=expected_turn,
                message=f"Invalid turn! Currently {expected_turn}'s turn.",
                lamport_time=request.lamport_time
            )

        uci_str = f"{request.from_square.lower()}{request.to_square.lower()}{request.promotion.lower() if request.promotion else ''}"

        try:
            move = chess.Move.from_uci(uci_str)
        except ValueError:
            return lamport_chess_pb2.LamportMakeMoveResponse(
                is_valid=False,
                current_fen=board.fen(),
                current_turn=expected_turn,
                message=f"Syntax error in notation: {uci_str}",
                lamport_time=request.lamport_time
            )

        if move in board.legal_moves:
            san = board.san(move)
            board.push(move)
            room["moves"].append(san)
            next_turn = "white" if board.turn == chess.WHITE else "black"

            return lamport_chess_pb2.LamportMakeMoveResponse(
                is_valid=True,
                move_san=san,
                current_fen=board.fen(),
                current_turn=next_turn,
                is_check=board.is_check(),
                is_checkmate=board.is_checkmate(),
                is_game_over=board.is_game_over(),
                message=f"Move {san} executed successfully.",
                lamport_time=request.lamport_time
            )
        else:
            return lamport_chess_pb2.LamportMakeMoveResponse(
                is_valid=False,
                current_fen=board.fen(),
                current_turn=expected_turn,
                message=f"Illegal move {uci_str}.",
                lamport_time=request.lamport_time
            )

    def GetGameState(self, request, context):
        received_time = request.lamport_time
        self.clock.receive_event(received_time)

        print("\n" + "-" * 50)
        print("Received Request: GetGameState")
        print(f"Room Code       : {request.room_code}")
        print(f"Incoming Clock  : {received_time}")
        print(f"Server Clock    : {self.clock.get_time()}")
        print("-" * 50)

        room_code = request.room_code
        if room_code not in self.rooms:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details("Room not found")
            return lamport_chess_pb2.LamportGetGameStateResponse(
                room_code=room_code,
                status="not_found",
                message=f"Room {room_code} not found.",
                lamport_time=request.lamport_time
            )

        room = self.rooms[room_code]
        board = room["board"]
        turn = "white" if board.turn == chess.WHITE else "black"

        return lamport_chess_pb2.LamportGetGameStateResponse(
            room_code=room_code,
            status=room["status"],
            current_turn=turn,
            fen=board.fen(),
            move_count=len(room["moves"]),
            move_history=room["moves"],
            message=f"State retrieved successfully.",
            lamport_time=request.lamport_time
        )


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    lamport_chess_pb2_grpc.add_LamportChessServiceServicer_to_server(LamportChessService(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    print("=" * 65)
    print("Chess Service Started on Port 50051...")
    print("Lamport-synchronized distributed service running...")
    print("=" * 65)
    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        print("\nShutting down Lamport Chess Server...")
        server.stop(0)


if __name__ == "__main__":
    serve()
