import express from 'express';

const router = express.Router();

// In-memory storage for rooms (in production, use a proper database)
const gameRooms = new Map();

// Debug endpoint to see active rooms (remove in production)
router.get('/rooms/debug', (req, res) => {
  const rooms = [];
  for (const [roomCode, roomData] of gameRooms.entries()) {
    rooms.push({
      roomCode,
      roomName: roomData.roomName,
      status: roomData.status,
      playerCount: roomData.playerCount,
      players: roomData.players.map(p => ({ email: p.email, color: p.color, role: p.role }))
    });
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Active rooms retrieved',
    data: {
      totalRooms: rooms.length,
      rooms: rooms
    }
  });
});

// POST /api/game/create-room - Create a new multiplayer room
router.post('/create-room', (req, res) => {
  try {
    const { roomName, gmail } = req.body;
    
    // Validate input
    if (!roomName || !gmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Room name and email are required'
      });
    }
    
    if (roomName.trim().length < 3) {
      return res.status(400).json({
        status: 'error',
        message: 'Room name must be at least 3 characters long'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(gmail)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address'
      });
    }
    
    // Generate a unique 3-digit room code
    let roomCode;
    do {
      roomCode = Math.floor(100 + Math.random() * 900).toString();
    } while (gameRooms.has(roomCode)); // Ensure uniqueness
    
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const roomData = {
      roomCode: roomCode,
      gameId: gameId,
      roomName: roomName.trim(),
      hostEmail: gmail.trim(),
      status: 'waiting', // waiting, ready, in_progress, finished
      playerCount: 1,
      maxPlayers: 2,
      players: [
        {
          email: gmail.trim(),
          role: 'host',
          color: 'white',
          joinedAt: new Date().toISOString()
        }
      ],
      gameMode: 'multiplayer',
      board: initializeChessBoard(),
      currentTurn: 'white',
      moveHistory: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    
    // Store the room
    gameRooms.set(roomCode, roomData);
    
    res.status(201).json({
      status: 'success',
      message: 'Room created successfully',
      data: {
        roomCode: roomCode,
        gameId: gameId,
        roomName: roomName.trim(),
        hostEmail: gmail.trim(),
        playersCount: 1
      }
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create room. Please try again.'
    });
  }
});

// GET /api/game/room/:roomCode - Get room details
router.get('/room/:roomCode', (req, res) => {
  try {
    const { roomCode } = req.params;
    
    if (!gameRooms.has(roomCode)) {
      return res.status(404).json({
        status: 'error',
        message: `Room with code '${roomCode}' not found`,
        data: null
      });
    }
    
    const roomData = gameRooms.get(roomCode);
    
    res.status(200).json({
      status: 'success',
      message: 'Room details retrieved successfully',
      data: {
        roomCode: roomCode,
        gameId: roomData.gameId,
        roomName: roomData.roomName,
        status: roomData.status,
        playerCount: roomData.playerCount,
        maxPlayers: roomData.maxPlayers,
        players: roomData.players,
        createdAt: roomData.createdAt
      }
    });
  } catch (error) {
    console.error('Error retrieving room:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve room details',
      data: null
    });
  }
});

// POST /api/game/room/:roomCode/join - Join a room
router.post('/room/:roomCode/join', (req, res) => {
  try {
    const { roomCode } = req.params;
    const { gmail } = req.body;
    
    if (!gmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required to join room'
      });
    }
    
    if (!gameRooms.has(roomCode)) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found'
      });
    }
    
    const roomData = gameRooms.get(roomCode);
    
    if (roomData.playerCount >= roomData.maxPlayers) {
      return res.status(400).json({
        status: 'error',
        message: 'Room is full'
      });
    }
    
    // Check if player is already in the room
    const existingPlayer = roomData.players.find(p => p.email === gmail);
    if (existingPlayer) {
      return res.status(400).json({
        status: 'error',
        message: 'You are already in this room'
      });
    }
    
    // Add player to room
    roomData.players.push({
      email: gmail.trim(),
      role: 'guest',
      color: 'black',
      joinedAt: new Date().toISOString()
    });
    
    roomData.playerCount++;
    roomData.lastActivity = new Date().toISOString();
    
    if (roomData.playerCount === roomData.maxPlayers) {
      roomData.status = 'ready';
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Successfully joined the room',
      data: {
        roomCode: roomCode,
        gameId: roomData.gameId,
        roomName: roomData.roomName,
        status: roomData.status,
        playerCount: roomData.playerCount,
        yourColor: 'black'
      }
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to join room'
    });
  }
});

// GET /api/game/start - Initialize a new game
router.get('/start', (req, res) => {
  try {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const gameState = {
      gameId: gameId,
      status: 'waiting', // waiting, in_progress, finished
      playerCount: 0,
      maxPlayers: 2,
      gameMode: req.query.mode || 'ai', // ai, multiplayer
      timeControl: req.query.timeControl || '10+0',
      board: initializeChessBoard(),
      currentTurn: 'white',
      moveHistory: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    res.status(200).json({
      status: 'success',
      message: 'Game initialized successfully',
      data: {
        game: gameState
      }
    });
  } catch (error) {
    console.error('Error initializing game:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize game'
    });
  }
});

// GET /api/game/:gameId - Get game state
router.get('/:gameId', (req, res) => {
  const { gameId } = req.params;
  
  // In a real app, this would fetch from database
  res.status(200).json({
    status: 'success',
    data: {
      gameId: gameId,
      status: 'waiting',
      message: 'Game state retrieved successfully'
    }
  });
});

// POST /api/game/room/:roomCode/move - Make a move in a room
router.post('/room/:roomCode/move', (req, res) => {
  try {
    const { roomCode } = req.params;
    const { from, to, piece, playerEmail } = req.body;
    
    // Validate input
    if (!from || !to || !piece || !playerEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Move data (from, to, piece, playerEmail) is required'
      });
    }
    
    if (!gameRooms.has(roomCode)) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found'
      });
    }
    
    const roomData = gameRooms.get(roomCode);
    
    // Check if game is ready to play
    if (roomData.status !== 'ready' && roomData.status !== 'in_progress') {
      return res.status(400).json({
        status: 'error',
        message: 'Game is not ready to play'
      });
    }
    
    // Find the player making the move
    const player = roomData.players.find(p => p.email === playerEmail);
    if (!player) {
      return res.status(403).json({
        status: 'error',
        message: 'Player not found in this room'
      });
    }
    
    // Check if it's the player's turn
    if (player.color !== roomData.currentTurn) {
      return res.status(400).json({
        status: 'error',
        message: `It's not your turn. Current turn: ${roomData.currentTurn}`
      });
    }
    
    // Apply the move to the board
    const newBoard = roomData.board.map(row => [...row]);
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    
    // Basic validation
    if (fromRow < 0 || fromRow >= 8 || fromCol < 0 || fromCol >= 8 ||
        toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid move coordinates'
      });
    }
    
    // Verify the piece at the from position matches
    if (roomData.board[fromRow][fromCol] !== piece) {
      return res.status(400).json({
        status: 'error',
        message: 'Piece mismatch'
      });
    }
    
    // Apply the move
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    
    // Create move record
    const move = {
      from: from,
      to: to,
      piece: piece,
      player: playerEmail,
      playerColor: player.color,
      timestamp: new Date().toISOString(),
      moveNumber: roomData.moveHistory.length + 1
    };
    
    // Update room data
    roomData.board = newBoard;
    roomData.moveHistory.push(move);
    roomData.currentTurn = roomData.currentTurn === 'white' ? 'black' : 'white';
    roomData.status = 'in_progress';
    roomData.lastActivity = new Date().toISOString();
    
    res.status(200).json({
      status: 'success',
      message: 'Move processed successfully',
      data: {
        move: move,
        currentTurn: roomData.currentTurn,
        gameStatus: roomData.status,
        moveNumber: move.moveNumber
      }
    });
  } catch (error) {
    console.error('Error processing move:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process move'
    });
  }
});

// POST /api/game/room/:roomCode/finish - Finish a game and record result
router.post('/room/:roomCode/finish', (req, res) => {
  try {
    const { roomCode } = req.params;
    const { gameResult, winnerEmail, totalMoves, gameDurationMinutes } = req.body;
    
    // Validate input
    if (!gameResult) {
      return res.status(400).json({
        status: 'error',
        message: 'Game result is required'
      });
    }
    
    if (!['white_wins', 'black_wins', 'draw', 'resignation', 'timeout'].includes(gameResult)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid game result'
      });
    }
    
    if (!gameRooms.has(roomCode)) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found'
      });
    }
    
    const roomData = gameRooms.get(roomCode);
    
    if (roomData.status === 'finished') {
      return res.status(400).json({
        status: 'error',
        message: 'Game already finished'
      });
    }
    
    // Validate that we have 2 players
    if (roomData.players.length !== 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Game requires 2 players to finish'
      });
    }
    
    const whitePlayer = roomData.players.find(p => p.color === 'white');
    const blackPlayer = roomData.players.find(p => p.color === 'black');
    
    if (!whitePlayer || !blackPlayer) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid player configuration'
      });
    }
    
    // Map resignation/timeout to actual result
    let finalResult = gameResult;
    let finalWinner = winnerEmail;
    
    if (gameResult === 'resignation' || gameResult === 'timeout') {
      if (winnerEmail === whitePlayer.email) {
        finalResult = 'white_wins';
      } else if (winnerEmail === blackPlayer.email) {
        finalResult = 'black_wins';
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid winner for resignation/timeout'
        });
      }
    }
    
    // Update room status
    roomData.status = 'finished';
    roomData.finishedAt = new Date().toISOString();
    roomData.gameResult = finalResult;
    roomData.winnerEmail = finalWinner;
    roomData.lastActivity = new Date().toISOString();
    
    // Record game result in leaderboard (this would normally call the leaderboard API)
    const gameResultData = {
      roomCode: roomCode,
      gameId: roomData.gameId,
      playerWhiteEmail: whitePlayer.email,
      playerBlackEmail: blackPlayer.email,
      gameResult: finalResult,
      totalMoves: totalMoves || roomData.moveHistory.length,
      gameDurationMinutes: gameDurationMinutes
    };
    
    // Store result for potential leaderboard sync
    roomData.gameResultData = gameResultData;
    
    res.status(200).json({
      status: 'success',
      message: 'Game finished successfully',
      data: {
        roomCode: roomCode,
        gameResult: finalResult,
        winnerEmail: finalWinner,
        gameResultData: gameResultData,
        gameStats: {
          totalMoves: gameResultData.totalMoves,
          duration: gameDurationMinutes,
          players: {
            white: whitePlayer.email,
            black: blackPlayer.email
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error finishing game:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to finish game'
    });
  }
});

// GET /api/game/room/:roomCode/state - Get current game state
router.get('/room/:roomCode/state', (req, res) => {
  try {
    const { roomCode } = req.params;
    
    if (!gameRooms.has(roomCode)) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found'
      });
    }
    
    const roomData = gameRooms.get(roomCode);
    
    res.status(200).json({
      status: 'success',
      message: 'Game state retrieved successfully',
      data: {
        roomCode: roomCode,
        gameId: roomData.gameId,
        roomName: roomData.roomName,
        gameStatus: roomData.status,
        playerCount: roomData.playerCount,
        players: roomData.players,
        board: roomData.board,
        currentTurn: roomData.currentTurn,
        moveHistory: roomData.moveHistory,
        lastMove: roomData.moveHistory.length > 0 ? roomData.moveHistory[roomData.moveHistory.length - 1] : null,
        lastActivity: roomData.lastActivity
      }
    });
  } catch (error) {
    console.error('Error retrieving game state:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve game state'
    });
  }
});

// POST /api/game/:gameId/move - Make a move (legacy endpoint)
router.post('/:gameId/move', (req, res) => {
  const { gameId } = req.params;
  const { from, to, piece } = req.body;
  
  // In a real app, this would validate and apply the move
  res.status(200).json({
    status: 'success',
    message: 'Move processed successfully',
    data: {
      gameId: gameId,
      move: { from, to, piece },
      timestamp: new Date().toISOString()
    }
  });
});

// Helper function to initialize chess board
function initializeChessBoard() {
  // Standard chess starting position (matching frontend format)
  return [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
  ];
}

export default router;