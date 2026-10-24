"""
Backend Service Entrypoint (Experiment 2 & Experiment 8)
Re-exports and runs the ChessMate gRPC backend server (chess_server.py) on Port 50051.
"""

import sys
import chess_server

if __name__ == "__main__":
    chess_server.serve()
