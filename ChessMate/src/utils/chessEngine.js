import { Chess } from 'chess.js';

// Simple Chess Engine utility class with basic AI
class ChessEngine {
  constructor() {
    this.skillLevel = 5; // Default skill level (1-10)
    this.thinkTime = 1000; // Default think time in milliseconds
  }

  // Initialize engine (placeholder for future Stockfish integration)
  async initialize() {
    console.log('✅ Chess Engine initialized');
    return true;
  }

  // Set AI skill level
  setSkillLevel(level) {
    this.skillLevel = Math.max(1, Math.min(10, level));
  }

  // Simple AI move selection
  async getBestMove(chess, thinkTime = this.thinkTime) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const moves = chess.moves({ verbose: true });
        if (moves.length === 0) {
          resolve(null);
          return;
        }

        let bestMove;
        
        // Simple AI logic based on skill level
        if (this.skillLevel <= 3) {
          // Beginner: Random moves with slight preference for captures
          const captures = moves.filter(move => move.captured);
          if (captures.length > 0 && Math.random() < 0.6) {
            bestMove = captures[Math.floor(Math.random() * captures.length)];
          } else {
            bestMove = moves[Math.floor(Math.random() * moves.length)];
          }
        } else if (this.skillLevel <= 6) {
          // Intermediate: Prefer captures and checks
          const captures = moves.filter(move => move.captured);
          const checks = moves.filter(move => {
            const testChess = new Chess(chess.fen());
            testChess.move(move);
            return testChess.inCheck();
          });
          
          if (captures.length > 0 && Math.random() < 0.8) {
            bestMove = captures[Math.floor(Math.random() * captures.length)];
          } else if (checks.length > 0 && Math.random() < 0.5) {
            bestMove = checks[Math.floor(Math.random() * checks.length)];
          } else {
            bestMove = moves[Math.floor(Math.random() * moves.length)];
          }
        } else {
          // Advanced: Basic evaluation of moves
          bestMove = this.evaluateMoves(chess, moves);
        }
        
        resolve(bestMove);
      }, thinkTime);
    });
  }

  // Basic move evaluation for higher difficulty levels
  evaluateMoves(chess, moves) {
    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
      let score = 0;
      
      // Piece values
      const pieceValues = {
        'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
      };
      
      // Prefer captures
      if (move.captured) {
        score += pieceValues[move.captured.toLowerCase()] * 10;
      }
      
      // Prefer promotions
      if (move.promotion) {
        score += pieceValues[move.promotion.toLowerCase()] * 8;
      }
      
      // Prefer checks
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      if (testChess.inCheck()) {
        score += 5;
      }
      
      // Prefer central squares
      const centralSquares = ['d4', 'd5', 'e4', 'e5'];
      if (centralSquares.includes(move.to)) {
        score += 2;
      }
      
      // Add some randomness
      score += Math.random() * 2;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }

  // Cleanup (placeholder)
  cleanup() {
    console.log('Chess Engine cleanup');
  }
}

// Chess Game Logic utility class
class ChessGameLogic {
  constructor() {
    this.chess = new Chess();
    this.engine = new ChessEngine();
    this.gameHistory = [];
    this.engine.initialize();
  }

  // Initialize a new game
  initializeGame() {
    this.chess.reset();
    this.gameHistory = [];
    return this.getBoardArray();
  }

  // Get current board as 2D array
  getBoardArray() {
    const board = this.chess.board();
    return board.map(row => 
      row.map(square => square ? square.type.toUpperCase() * (square.color === 'w' ? 1 : -1) : null)
    );
  }

  // Convert chess.js board to display format
  getBoard() {
    const board = this.chess.board();
    return board.map(row => 
      row.map(square => {
        if (!square) return null;
        const piece = square.type.toUpperCase();
        return square.color === 'w' ? piece : piece.toLowerCase();
      })
    );
  }

  // Make a move
  async makeMove(from, to, promotion = 'q') {
    try {
      const move = this.chess.move({
        from,
        to,
        promotion
      });

      if (move) {
        this.gameHistory.push(move);
        
        return {
          valid: true,
          move: move,
          board: this.getBoard(),
          turn: this.chess.turn(),
          gameOver: this.chess.isGameOver(),
          winner: this.getWinner(),
          reason: this.getGameEndReason(),
          fen: this.chess.fen()
        };
      }
      return { valid: false };
    } catch (error) {
      console.error('Invalid move:', error);
      return { valid: false };
    }
  }

  // Make AI move
  async makeAIMove() {
    try {
      const bestMove = await this.engine.getBestMove(this.chess);
      
      if (bestMove) {
        const move = this.chess.move(bestMove);
        this.gameHistory.push(move);
        
        return {
          valid: true,
          move: move,
          board: this.getBoard(),
          turn: this.chess.turn(),
          gameOver: this.chess.isGameOver(),
          winner: this.getWinner(),
          reason: this.getGameEndReason(),
          fen: this.chess.fen()
        };
      }
      return { valid: false };
    } catch (error) {
      console.error('AI move error:', error);
      return { valid: false };
    }
  }

  // Get possible moves for a piece
  getPossibleMoves(square) {
    try {
      const moves = this.chess.moves({ 
        square: square, 
        verbose: true 
      });
      return moves.map(move => move.to);
    } catch (error) {
      console.error('Error getting possible moves:', error);
      return [];
    }
  }

  // Set AI skill level
  setAISkillLevel(level) {
    this.engine.setSkillLevel(level);
  }

  // Undo last move
  undoMove() {
    const move = this.chess.undo();
    if (move) {
      this.gameHistory.pop();
      return {
        valid: true,
        board: this.getBoard(),
        turn: this.chess.turn(),
        fen: this.chess.fen()
      };
    }
    return { valid: false };
  }

  // Get winner
  getWinner() {
    if (!this.chess.isGameOver()) return null;
    
    if (this.chess.isCheckmate()) {
      return this.chess.turn() === 'w' ? 'black' : 'white';
    }
    return 'draw';
  }

  // Get game end reason
  getGameEndReason() {
    if (!this.chess.isGameOver()) return null;
    
    if (this.chess.isCheckmate()) return 'checkmate';
    if (this.chess.isStalemate()) return 'stalemate';
    if (this.chess.isThreefoldRepetition()) return 'repetition';
    if (this.chess.isInsufficientMaterial()) return 'insufficient material';
    if (this.chess.isDraw()) return 'draw';
    
    return 'unknown';
  }

  // Get current game state
  getGameState() {
    return {
      board: this.getBoard(),
      turn: this.chess.turn(),
      gameOver: this.chess.isGameOver(),
      winner: this.getWinner(),
      reason: this.getGameEndReason(),
      inCheck: this.chess.inCheck(),
      fen: this.chess.fen(),
      history: this.gameHistory
    };
  }

  // Cleanup
  cleanup() {
    this.engine.cleanup();
  }
}

export { ChessEngine, ChessGameLogic };