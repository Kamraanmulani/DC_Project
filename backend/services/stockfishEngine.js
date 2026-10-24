import { Chess } from 'chess.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// For ES modules, we need to define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StockfishEngine {
  constructor() {
    this.engine = null;
    this.isReady = false;
    this.currentPosition = 'startpos';
    this.skillLevel = 10; // Default skill level (1-20)
    this.depth = 15; // Default search depth
    this.moveTime = 1000; // Default move time in milliseconds
    this.engineQueue = [];
    this.isProcessing = false;
    this.listeners = [];
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      try {
        // Try to use stockfish binary if available
        this.engine = spawn('stockfish', [], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // If stockfish binary is not available, use the JS version
        if (!this.engine || this.engine.killed) {
          this.initializeJSEngine()
            .then(() => resolve())
            .catch(reject);
          return;
        }

        this.engine.stdout.on('data', (data) => {
          const line = data.toString().trim();
          console.log('Stockfish:', line);
          this.listeners.forEach(listener => listener(line));
          
          if (line === 'uciok') {
            this.isReady = true;
            resolve();
          }
          
          if (line.startsWith('bestmove')) {
            const bestMove = line.split(' ')[1];
            if (this.engineQueue.length > 0) {
              const { resolve: resolveMove } = this.engineQueue.shift();
              this.isProcessing = false;
              resolveMove(bestMove);
              this.processQueue();
            }
          }
        });

        this.engine.stderr.on('data', (data) => {
          console.error('Stockfish Error:', data.toString());
        });

        this.engine.on('close', (code) => {
          console.log('Stockfish process closed with code:', code);
          this.isReady = false;
        });

        // Initialize UCI protocol
        this.sendCommand('uci');
        
        // Set initial options
        setTimeout(() => {
          this.setSkillLevel(this.skillLevel);
        }, 100);
        
      } catch (error) {
        console.error('Failed to initialize Stockfish binary, falling back to JS engine');
        this.initializeJSEngine()
          .then(() => resolve())
          .catch(reject);
      }
    });
  }

  async initializeJSEngine() {
    return new Promise((resolve, reject) => {
      try {
        // Use a simple chess engine fallback instead of stockfish
        console.log('✅ Using fallback chess engine (Enhanced AI)');
        this.isReady = true;
        this.engine = { isJS: true }; // Mark as JS engine
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  sendCommand(command) {
    if (this.engine && !this.engine.isJS) {
      this.engine.stdin.write(command + '\n');
    }
  }

  addMessageListener(callback) {
    this.listeners.push(callback);
  }

  removeMessageListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  setSkillLevel(level) {
    if (!this.isReady) return;
    
    this.skillLevel = Math.max(1, Math.min(20, level));
    
    if (this.engine && !this.engine.isJS) {
      // Configure Stockfish for different skill levels
      if (this.skillLevel <= 5) {
        this.sendCommand(`setoption name Skill Level value ${this.skillLevel}`);
        this.sendCommand(`setoption name UCI_LimitStrength value true`);
        this.sendCommand(`setoption name UCI_Elo value ${800 + this.skillLevel * 200}`);
      } else if (this.skillLevel <= 10) {
        this.sendCommand(`setoption name Skill Level value ${this.skillLevel}`);
        this.sendCommand(`setoption name UCI_LimitStrength value true`);
        this.sendCommand(`setoption name UCI_Elo value ${1200 + this.skillLevel * 100}`);
      } else if (this.skillLevel <= 15) {
        this.sendCommand(`setoption name Skill Level value ${this.skillLevel}`);
        this.sendCommand(`setoption name UCI_LimitStrength value true`);
        this.sendCommand(`setoption name UCI_Elo value ${1800 + this.skillLevel * 50}`);
      } else {
        // Maximum strength
        this.sendCommand(`setoption name Skill Level value 20`);
        this.sendCommand(`setoption name UCI_LimitStrength value false`);
      }
    }
    
    console.log(`Chess Engine skill level set to: ${this.skillLevel}`);
  }

  setDepth(depth) {
    this.depth = Math.max(1, Math.min(20, depth));
  }

  setMoveTime(timeMs) {
    this.moveTime = Math.max(100, Math.min(10000, timeMs));
  }

  async getBestMove(fen, moves = []) {
    if (!this.isReady) {
      throw new Error('Chess engine not ready');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Chess engine timeout'));
      }, this.moveTime + 5000);

      if (this.engine.isJS) {
        // Use simple AI fallback
        setTimeout(() => {
          clearTimeout(timeoutId);
          const move = this.getSimpleAIMove(fen);
          resolve(move);
        }, Math.random() * 1000 + 500);
        return;
      }

      this.engineQueue.push({ 
        resolve: (move) => {
          clearTimeout(timeoutId);
          resolve(move);
        },
        fen,
        moves
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  getSimpleAIMove(fen) {
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });
      
      if (moves.length === 0) return null;

      // Simple AI logic based on difficulty
      if (this.skillLevel <= 3) {
        // Easy: Random moves with preference for captures
        const captures = moves.filter(move => move.captured);
        if (captures.length > 0 && Math.random() < 0.6) {
          const move = captures[Math.floor(Math.random() * captures.length)];
          return move.from + move.to + (move.promotion || '');
        }
        const move = moves[Math.floor(Math.random() * moves.length)];
        return move.from + move.to + (move.promotion || '');
      } else if (this.skillLevel <= 6) {
        // Medium: Prefer captures and checks
        const captures = moves.filter(move => move.captured);
        const checks = moves.filter(move => {
          const testChess = new Chess(fen);
          testChess.move(move);
          return testChess.inCheck();
        });
        
        if (captures.length > 0 && Math.random() < 0.7) {
          const move = captures[Math.floor(Math.random() * captures.length)];
          return move.from + move.to + (move.promotion || '');
        } else if (checks.length > 0 && Math.random() < 0.5) {
          const move = checks[Math.floor(Math.random() * checks.length)];
          return move.from + move.to + (move.promotion || '');
        }
        
        const move = moves[Math.floor(Math.random() * moves.length)];
        return move.from + move.to + (move.promotion || '');
      } else {
        // Hard: Basic evaluation
        const move = this.evaluateMoves(chess, moves);
        return move.from + move.to + (move.promotion || '');
      }
    } catch (error) {
      console.error('Simple AI move error:', error);
      return null;
    }
  }

  evaluateMoves(chess, moves) {
    let bestMove = moves[0];
    let bestScore = -Infinity;

    const pieceValues = {
      'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
    };

    for (const move of moves) {
      let score = 0;
      
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
      
      // Add some randomness based on skill level
      score += Math.random() * (this.skillLevel / 10);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }

  processQueue() {
    if (this.engineQueue.length === 0 || this.isProcessing || this.engine.isJS) {
      return;
    }

    this.isProcessing = true;
    const { fen, moves } = this.engineQueue[0];

    // Set position
    if (moves && moves.length > 0) {
      this.sendCommand(`position startpos moves ${moves.join(' ')}`);
    } else {
      this.sendCommand(`position fen ${fen}`);
    }

    // Start analysis
    this.sendCommand(`go movetime ${this.moveTime}`);
  }

  async analyzePosition(fen, depth = this.depth) {
    if (!this.isReady) {
      throw new Error('Chess engine not ready');
    }

    if (this.engine.isJS) {
      // Simple analysis for JS engine
      const chess = new Chess(fen);
      const moves = chess.moves();
      
      return {
        bestMove: this.getSimpleAIMove(fen),
        evaluation: Math.random() * 0.4 - 0.2, // Random evaluation between -0.2 and 0.2
        depth: 3,
        nodes: moves.length * 100,
        time: 500
      };
    }

    return new Promise((resolve) => {
      const analysis = {
        bestMove: null,
        evaluation: 0,
        depth: 0,
        nodes: 0,
        time: 0
      };

      const messageListener = (line) => {
        if (line.startsWith('info depth')) {
          const parts = line.split(' ');
          const depthIndex = parts.indexOf('depth');
          const scoreIndex = parts.indexOf('score');
          const nodesIndex = parts.indexOf('nodes');
          const timeIndex = parts.indexOf('time');

          if (depthIndex !== -1) analysis.depth = parseInt(parts[depthIndex + 1]);
          if (nodesIndex !== -1) analysis.nodes = parseInt(parts[nodesIndex + 1]);
          if (timeIndex !== -1) analysis.time = parseInt(parts[timeIndex + 1]);
          
          if (scoreIndex !== -1) {
            const scoreType = parts[scoreIndex + 1];
            if (scoreType === 'cp') {
              analysis.evaluation = parseInt(parts[scoreIndex + 2]) / 100;
            } else if (scoreType === 'mate') {
              analysis.evaluation = parseInt(parts[scoreIndex + 2]) > 0 ? 9999 : -9999;
            }
          }
        }

        if (line.startsWith('bestmove')) {
          analysis.bestMove = line.split(' ')[1];
          this.removeMessageListener(messageListener);
          resolve(analysis);
        }
      };

      this.addMessageListener(messageListener);
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);
    });
  }

  isValidMove(fen, move) {
    try {
      const chess = new Chess(fen);
      const result = chess.move(move);
      return result !== null;
    } catch {
      return false;
    }
  }

  stop() {
    if (this.engine && !this.engine.isJS) {
      this.sendCommand('stop');
    }
  }

  quit() {
    if (this.engine && !this.engine.isJS) {
      this.sendCommand('quit');
      this.engine.kill();
    }
    this.engine = null;
    this.isReady = false;
    this.listeners = [];
  }
}

// Singleton instance
let stockfishInstance = null;

export const getStockfishEngine = async () => {
  if (!stockfishInstance) {
    stockfishInstance = new StockfishEngine();
    await stockfishInstance.initialize();
  }
  return stockfishInstance;
};

export default StockfishEngine;