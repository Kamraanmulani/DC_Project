// Service for handling leaderboard and game results
const API_BASE_URL = 'http://localhost:5000/api';

export const leaderboardService = {
  // Get leaderboard data
  async getLeaderboard(page = 1, limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard?page=${page}&limit=${limit}`);
      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to fetch leaderboard'
        };
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  },

  // Get player stats
  async getPlayerStats(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard/player/${encodeURIComponent(email)}`);
      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.message || 'Player not found'
        };
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  },

  // Get top players
  async getTopPlayers(count = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard/top/${count}`);
      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: result.data.topPlayers
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to fetch top players'
        };
      }
    } catch (error) {
      console.error('Error fetching top players:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  },

  // Record game result
  async recordGameResult(gameResultData) {
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard/game-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameResultData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to record game result'
        };
      }
    } catch (error) {
      console.error('Error recording game result:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  }
};

export const gameService = {
  // Finish a game
  async finishGame(roomCode, gameResult, winnerEmail, totalMoves, gameDurationMinutes) {
    try {
      const response = await fetch(`${API_BASE_URL}/game/room/${roomCode}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameResult,
          winnerEmail,
          totalMoves,
          gameDurationMinutes
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to finish game'
        };
      }
    } catch (error) {
      console.error('Error finishing game:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  },

  // Utility function to check if position is valid
  isValidPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  },

  // Get all squares that a piece can attack (not considering if move puts own king in check)
  getPieceAttackSquares(piece, row, col, board) {
    const attacks = [];
    if (!piece) return attacks;
    
    const isWhite = piece === piece.toUpperCase();
    
    switch (piece.toLowerCase()) {
      case 'p': {
        // Pawn attacks diagonally
        const direction = isWhite ? -1 : 1;
        for (const colOffset of [-1, 1]) {
          const newRow = row + direction;
          const newCol = col + colOffset;
          if (this.isValidPosition(newRow, newCol)) {
            attacks.push([newRow, newCol]);
          }
        }
        break;
      }
      case 'r': {
        // Rook attacks horizontally and vertically
        const directions = [[0,1],[0,-1],[1,0],[-1,0]];
        for (const [dr, dc] of directions) {
          for (let i = 1; i < 8; i++) {
            const newRow = row + i * dr;
            const newCol = col + i * dc;
            if (!this.isValidPosition(newRow, newCol)) break;
            
            attacks.push([newRow, newCol]);
            
            // Stop if we hit any piece
            if (board[newRow][newCol]) break;
          }
        }
        break;
      }
      case 'n': {
        // Knight attacks in L-shape
        const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of knightMoves) {
          const newRow = row + dr;
          const newCol = col + dc;
          if (this.isValidPosition(newRow, newCol)) {
            attacks.push([newRow, newCol]);
          }
        }
        break;
      }
      case 'b': {
        // Bishop attacks diagonally
        const directions = [[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dr, dc] of directions) {
          for (let i = 1; i < 8; i++) {
            const newRow = row + i * dr;
            const newCol = col + i * dc;
            if (!this.isValidPosition(newRow, newCol)) break;
            
            attacks.push([newRow, newCol]);
            
            // Stop if we hit any piece
            if (board[newRow][newCol]) break;
          }
        }
        break;
      }
      case 'q': {
        // Queen attacks like rook + bishop
        const directions = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dr, dc] of directions) {
          for (let i = 1; i < 8; i++) {
            const newRow = row + i * dr;
            const newCol = col + i * dc;
            if (!this.isValidPosition(newRow, newCol)) break;
            
            attacks.push([newRow, newCol]);
            
            // Stop if we hit any piece
            if (board[newRow][newCol]) break;
          }
        }
        break;
      }
      case 'k': {
        // King attacks adjacent squares
        const kingMoves = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (const [dr, dc] of kingMoves) {
          const newRow = row + dr;
          const newCol = col + dc;
          if (this.isValidPosition(newRow, newCol)) {
            attacks.push([newRow, newCol]);
          }
        }
        break;
      }
    }
    
    return attacks;
  },

  // Check if a king is in check
  isKingInCheck(board, playerColor, kingPosition = null) {
    // Find king position if not provided
    if (!kingPosition) {
      const kingPiece = playerColor === 'white' ? 'K' : 'k';
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (board[row][col] === kingPiece) {
            kingPosition = [row, col];
            break;
          }
        }
        if (kingPosition) break;
      }
    }
    
    if (!kingPosition) return false;
    
    const [kingRow, kingCol] = kingPosition;
    const opponentColor = playerColor === 'white' ? 'black' : 'white';
    
    // Check if any opponent piece can attack the king position
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const pieceColor = piece === piece.toUpperCase() ? 'white' : 'black';
          if (pieceColor === opponentColor) {
            const attacks = this.getPieceAttackSquares(piece, row, col, board);
            if (attacks.some(([r, c]) => r === kingRow && c === kingCol)) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  },

  // Check if a move would put or leave the player's own king in check
  wouldMoveExposeKing(board, fromRow, fromCol, toRow, toCol, playerColor) {
    // Create a temporary board with the move applied
    const tempBoard = board.map(row => [...row]);
    const piece = tempBoard[fromRow][fromCol];
    
    // Apply the move
    tempBoard[toRow][toCol] = piece;
    tempBoard[fromRow][fromCol] = null;
    
    // Check if king is in check after this move
    return this.isKingInCheck(tempBoard, playerColor);
  },

  // Get all legal moves for a piece (considering check)
  getLegalMoves(piece, row, col, board, getValidMoves) {
    if (!piece) return [];
    
    const pieceColor = piece === piece.toUpperCase() ? 'white' : 'black';
    const potentialMoves = getValidMoves(piece, row, col, board);
    const legalMoves = [];
    
    // Filter out moves that would put/leave king in check
    for (const [toRow, toCol] of potentialMoves) {
      if (!this.wouldMoveExposeKing(board, row, col, toRow, toCol, pieceColor)) {
        legalMoves.push([toRow, toCol]);
      }
    }
    
    return legalMoves;
  },

  // Check if player has any legal moves
  hasLegalMoves(board, playerColor, getValidMoves) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const pieceColor = piece === piece.toUpperCase() ? 'white' : 'black';
          if (pieceColor === playerColor) {
            const legalMoves = this.getLegalMoves(piece, row, col, board, getValidMoves);
            if (legalMoves.length > 0) {
              return true;
            }
          }
        }
      }
    }
    return false;
  },

  // Main function to check for game end (checkmate, stalemate, etc.)
  checkGameEnd(board, currentPlayer, getValidMoves) {
    console.log('Checking game end for player:', currentPlayer);
    
    // Find the current player's king
    const kingPiece = currentPlayer === 'white' ? 'K' : 'k';
    let kingPosition = null;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === kingPiece) {
          kingPosition = [row, col];
          break;
        }
      }
      if (kingPosition) break;
    }
    
    if (!kingPosition) {
      console.log('King not found - this should not happen');
      return { gameEnded: true, result: 'draw', reason: 'King not found' };
    }
    
    // Check if king is currently in check
    const isInCheck = this.isKingInCheck(board, currentPlayer, kingPosition);
    console.log(`${currentPlayer} king is ${isInCheck ? 'in check' : 'safe'}`);
    
    // Check if player has any legal moves
    const hasLegalMoves = this.hasLegalMoves(board, currentPlayer, getValidMoves);
    console.log(`${currentPlayer} has legal moves:`, hasLegalMoves);
    
    if (!hasLegalMoves) {
      if (isInCheck) {
        // Checkmate - opponent wins
        const winner = currentPlayer === 'white' ? 'black' : 'white';
        console.log(`CHECKMATE! ${winner} wins!`);
        return {
          gameEnded: true,
          result: winner === 'white' ? 'white_wins' : 'black_wins',
          reason: 'checkmate'
        };
      } else {
        // Stalemate - draw
        console.log('STALEMATE! Game is a draw');
        return {
          gameEnded: true,
          result: 'draw',
          reason: 'stalemate'
        };
      }
    }
    
    // Check for insufficient material (basic implementation)
    if (this.isInsufficientMaterial(board)) {
      console.log('Insufficient material - draw');
      return {
        gameEnded: true,
        result: 'draw',
        reason: 'insufficient material'
      };
    }
    
    // Game continues
    return { gameEnded: false };
  },

  // Check for insufficient material to deliver checkmate
  isInsufficientMaterial(board) {
    const pieces = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          pieces.push(piece.toLowerCase());
        }
      }
    }
    
    // Remove kings from count
    const nonKingPieces = pieces.filter(p => p !== 'k');
    
    // King vs King
    if (nonKingPieces.length === 0) {
      return true;
    }
    
    // King vs King + Bishop
    if (nonKingPieces.length === 1 && nonKingPieces[0] === 'b') {
      return true;
    }
    
    // King vs King + Knight
    if (nonKingPieces.length === 1 && nonKingPieces[0] === 'n') {
      return true;
    }
    
    // King + Bishop vs King + Bishop (same color squares)
    if (nonKingPieces.length === 2 && 
        nonKingPieces.every(p => p === 'b')) {
      // This would require checking if bishops are on same color squares
      // For simplicity, we'll skip this complex check
    }
    
    return false;
  }
};