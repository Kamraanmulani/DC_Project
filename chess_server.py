"""
ChessMate gRPC Server Service - Experiment 2
Develop RPC APIs to Enable Communication Between Services for your mini project
"""

import sys
import time
import random
import concurrent.futures as futures
import grpc
import chess

# Import compiled protobuf stubs
import chess_pb2
import chess_pb2_grpc


class ChessService(chess_pb2_grpc.ChessServiceServicer):
    def __init__(self):
        # In-memory store for active chess rooms
        self.rooms = {}
        print("[SERVER] Initialized ChessMate Game State Manager")

    def CreateRoom(self, request, context):
        # Generate unique 3-digit room code like ChessMate web backend
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

        print(f"[SERVER] [RPC: CreateRoom] Room Created: '{request.room_name}' (Code: {room_code}) by {request.player_email}")

        return chess_pb2.CreateRoomResponse(
            room_code=room_code,
            game_id=game_id,
            status="created",
            message=f"Game room '{request.room_name}' initialized successfully with standard 8x8 chessboard."
        )

    def MakeMove(self, request, context):
        room_code = request.room_code
        if room_code not in self.rooms:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details("Room code not found")
            return chess_pb2.MakeMoveResponse(
                is_valid=False,
                message=f"Room {room_code} does not exist."
            )

        room = self.rooms[room_code]
        board = room["board"]

        # Expected turn verification
        expected_turn = "white" if board.turn == chess.WHITE else "black"
        if request.player_color.lower() != expected_turn:
            return chess_pb2.MakeMoveResponse(
                is_valid=False,
                current_fen=board.fen(),
                current_turn=expected_turn,
                message=f"Invalid turn! It is currently {expected_turn}'s turn to move."
            )

        # Parse UCI move (e.g., e2 -> e4 = "e2e4")
        uci_str = f"{request.from_square.lower()}{request.to_square.lower()}{request.promotion.lower() if request.promotion else ''}"

        try:
            move = chess.Move.from_uci(uci_str)
        except ValueError:
            return chess_pb2.MakeMoveResponse(
                is_valid=False,
                current_fen=board.fen(),
                current_turn=expected_turn,
                message=f"Syntax error in move notation: {uci_str}"
            )

        if move in board.legal_moves:
            san = board.san(move)
            board.push(move)
            room["moves"].append(san)
            next_turn = "white" if board.turn == chess.WHITE else "black"

            print(f"[SERVER] [RPC: MakeMove] Room {room_code}: {request.player_color.upper()} played {san} ({uci_str}) -> Next turn: {next_turn}")

            return chess_pb2.MakeMoveResponse(
                is_valid=True,
                move_san=san,
                current_fen=board.fen(),
                current_turn=next_turn,
                is_check=board.is_check(),
                is_checkmate=board.is_checkmate(),
                is_game_over=board.is_game_over(),
                message=f"Move {san} executed successfully."
            )
        else:
            print(f"[SERVER] [RPC: MakeMove] Illegal move attempted: {uci_str} in room {room_code}")
            return chess_pb2.MakeMoveResponse(
                is_valid=False,
                current_fen=board.fen(),
                current_turn=expected_turn,
                message=f"Illegal move {uci_str} for current board state."
            )

    def GetGameState(self, request, context):
        room_code = request.room_code
        if room_code not in self.rooms:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details("Room not found")
            return chess_pb2.GetGameStateResponse(
                room_code=room_code,
                status="not_found",
                message=f"Room {room_code} not found."
            )

        room = self.rooms[room_code]
        board = room["board"]
        turn = "white" if board.turn == chess.WHITE else "black"

        print(f"[SERVER] [RPC: GetGameState] Room {room_code} state queried. Total moves: {len(room['moves'])}")

        return chess_pb2.GetGameStateResponse(
            room_code=room_code,
            status=room["status"],
            current_turn=turn,
            fen=board.fen(),
            move_count=len(room["moves"]),
            move_history=room["moves"],
            message=f"Retrieved state for room {room_code}."
        )


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    chess_pb2_grpc.add_ChessServiceServicer_to_server(ChessService(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    print("=" * 65)
    print("Chess Service Started on Port 50051...")
    print("Distributed gRPC Server active and waiting for RPC calls...")
    print("=" * 65)
    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        print("\nStopping Chess gRPC Server...")
        server.stop(0)


if __name__ == "__main__":
    serve()
