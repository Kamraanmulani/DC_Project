import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gameService, leaderboardService } from '../../services/gameService';
import './GamePvP.css'; // make sure filename/casing matches

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract room code and email from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const roomCode = searchParams.get('roomCode');
  const playerEmail = searchParams.get('email');

  console.log('URL Parameters:', { 
    roomCode, 
    playerEmail, 
    searchString: location.search, 
    pathname: location.pathname 
  });

  const gameMode = location.pathname.includes('AI') ? 'ai' :
                   location.pathname.includes('PvP') ? 'pvp' : 'standard';

  const initialBoard = [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
  ];

  const [board, setBoard] = useState(initialBoard);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('white');
  const [validMoves, setValidMoves] = useState([]);
  const [roomStatus, setRoomStatus] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [gameState, setGameState] = useState(null);
  const [lastMoveInfo, setLastMoveInfo] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [myColor, setMyColor] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameEndCountdown, setGameEndCountdown] = useState(null);
  const [countdownTimer, setCountdownTimer] = useState(null);

  const pieceSymbols = {
    'K': '♔','Q': '♕','R': '♖','B': '♗','N': '♘','P': '♙',
    'k': '♚','q': '♛','r': '♜','b': '♝','n': '♞','p': '♟'
  };

  const isCurrentPlayerPiece = (piece) => {
    if (!piece) return false;
    return currentPlayer === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
  };

  // Fetch room status and game state when component mounts or roomCode changes
  useEffect(() => {
    if (roomCode && gameMode === 'pvp') {
      fetchRoomStatus();
      fetchGameState();
      // Reduced polling frequency to prevent rate limiting
      const statusInterval = setInterval(fetchRoomStatus, 10000); // Every 10 seconds
      const gameInterval = setInterval(fetchGameState, 5000); // Every 5 seconds
      return () => {
        clearInterval(statusInterval);
        clearInterval(gameInterval);
      };
    }
  }, [roomCode, gameMode]);

  // Determine player's color and turn status
  useEffect(() => {
    console.log('Determining player color:', { players, playerEmail, gameState });
    if (players.length > 0 && playerEmail) {
      const currentPlayer = players.find(p => p.email === playerEmail);
      console.log('Found current player:', currentPlayer);
      if (currentPlayer) {
        setMyColor(currentPlayer.color);
        console.log('Set myColor to:', currentPlayer.color);
        const myTurn = gameState?.currentTurn === currentPlayer.color;
        setIsMyTurn(myTurn);
        console.log('Is my turn:', myTurn, 'Current turn:', gameState?.currentTurn);
      } else {
        console.warn('Player not found in room:', { playerEmail, players });
      }
    }
  }, [players, playerEmail, gameState]);

  // Update game started status
  useEffect(() => {
    const wasGameStarted = gameStarted;
    const isNowStarted = roomStatus === 'ready' || roomStatus === 'in_progress';
    setGameStarted(isNowStarted);
    
    // Record game start time when game begins
    if (!wasGameStarted && isNowStarted && !gameStartTime) {
      setGameStartTime(Date.now());
    }
  }, [roomStatus, gameStarted, gameStartTime]);

  // Check for game end when board state changes
  useEffect(() => {
    if (gameStarted && !gameEnded && gameMode === 'pvp') {
      // Add a small delay to ensure all state updates are complete
      const checkTimer = setTimeout(() => {
        checkForGameEnd();
      }, 300);
      
      return () => clearTimeout(checkTimer);
    }
  }, [board, currentPlayer, gameStarted, gameEnded, gameMode]);

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  }, [countdownTimer]);

  const fetchRoomStatus = async () => {
    if (!roomCode) return;
    
    setIsLoadingRoom(true);
    try {
      const response = await fetch(`http://localhost:5000/api/game/room/${roomCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setRoomStatus(result.data.status);
        setPlayers(result.data.players || []);
        setRoomError('');
        
        // If playerEmail is missing from URL but we have players, help user identify themselves
        if (!playerEmail && result.data.players.length > 0) {
          console.warn('No email in URL. Available players:', result.data.players.map(p => p.email));
        }
      } else {
        setRoomError(result.message || 'Failed to fetch room status');
      }
    } catch (error) {
      console.error('Error fetching room status:', error);
      setRoomError('Network error - check server connection');
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const fetchGameState = async () => {
    if (!roomCode) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/game/room/${roomCode}/state`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.status === 'success') {
          const newGameState = result.data;
          setGameState(newGameState);
          
          // Update board if it exists in game state
          if (newGameState.board) {
            setBoard(newGameState.board);
          }
          
          // Update current player based on server state
          if (newGameState.currentTurn) {
            setCurrentPlayer(newGameState.currentTurn);
          }
          
          // Display information about the last move
          if (newGameState.lastMove) {
            setLastMoveInfo(newGameState.lastMove);
          }
        }
      } else if (response.status !== 404) {
        // Only log non-404 errors (404 is expected when room doesn't have game state yet)
        console.warn('Failed to fetch game state:', response.status);
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

  const isValidPosition = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

  // getValidMoves (same logic you had, unchanged) - for brevity I reuse original working logic
  const getValidMoves = (piece, row, col, board) => {
    const moves = [];
    if (!piece) return moves;
    const isWhite = piece === piece.toUpperCase();
    switch (piece.toLowerCase()) {
      case 'p': {
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
          moves.push([row + direction, col]);
          if (row === startRow && !board[row + 2 * direction][col]) {
            moves.push([row + 2 * direction, col]);
          }
        }
        for (const colOffset of [-1, 1]) {
          const newCol = col + colOffset;
          if (isValidPosition(row + direction, newCol) && board[row + direction][newCol]) {
            const target = board[row + direction][newCol];
            if ((isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase())) {
              moves.push([row + direction, newCol]);
            }
          }
        }
        break;
      }
      case 'r': {
        const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
        for (const [dr,dc] of dirs) {
          for (let i=1;i<8;i++){
            const nr=row+i*dr, nc=col+i*dc;
            if (!isValidPosition(nr,nc)) break;
            const t = board[nr][nc];
            if (!t) moves.push([nr,nc]);
            else { if ((isWhite && t===t.toLowerCase())||(!isWhite && t===t.toUpperCase())) moves.push([nr,nc]); break; }
          }
        }
        break;
      }
      case 'n': {
        const kMoves=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr,dc] of kMoves){
          const nr=row+dr, nc=col+dc;
          if (!isValidPosition(nr,nc)) continue;
          const t = board[nr][nc];
          if (!t || (isWhite && t===t.toLowerCase()) || (!isWhite && t===t.toUpperCase())) moves.push([nr,nc]);
        }
        break;
      }
      case 'b': {
        const dirs=[[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dr,dc] of dirs) {
          for (let i=1;i<8;i++){
            const nr=row+i*dr, nc=col+i*dc;
            if (!isValidPosition(nr,nc)) break;
            const t=board[nr][nc];
            if (!t) moves.push([nr,nc]);
            else { if ((isWhite && t===t.toLowerCase())||(!isWhite && t===t.toUpperCase())) moves.push([nr,nc]); break; }
          }
        }
        break;
      }
      case 'q': {
        const dirs=[[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dr,dc] of dirs) {
          for (let i=1;i<8;i++){
            const nr=row+i*dr, nc=col+i*dc;
            if (!isValidPosition(nr,nc)) break;
            const t=board[nr][nc];
            if (!t) moves.push([nr,nc]);
            else { if ((isWhite && t===t.toLowerCase())||(!isWhite && t===t.toUpperCase())) moves.push([nr,nc]); break; }
          }
        }
        break;
      }
      case 'k': {
        const km=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (const [dr,dc] of km) {
          const nr=row+dr, nc=col+dc;
          if (!isValidPosition(nr,nc)) continue;
          const t=board[nr][nc];
          if (!t || (isWhite && t===t.toLowerCase()) || (!isWhite && t===t.toUpperCase())) moves.push([nr,nc]);
        }
        break;
      }
      default: break;
    }
    return moves;
  };

  const makeMove = async (fromRow, fromCol, toRow, toCol, piece) => {
    if (gameMode !== 'pvp' || !roomCode || !playerEmail) {
      // For non-PvP games, handle locally
      const newBoard = board.map(r => [...r]);
      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = null;
      setBoard(newBoard);
      setCurrentPlayer(prev => prev === 'white' ? 'black' : 'white');
      return true;
    }

    // For PvP games, send move to server
    try {
      const response = await fetch(`http://localhost:5000/api/game/room/${roomCode}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: [fromRow, fromCol],
          to: [toRow, toCol],
          piece: piece,
          playerEmail: playerEmail
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Move was successful, the board will be updated via fetchGameState
        console.log('Move successful:', result.data.move);
        // Immediately fetch the updated game state
        await fetchGameState();
        
        // Increment move count
        setMoveCount(prev => prev + 1);
        
        // Check for game ending conditions after a successful move
        // Use a small delay to ensure board state is fully updated
        setTimeout(() => {
          checkForGameEnd();
        }, 500); // Reduced delay for faster detection
        
        return true;
      } else {
        console.error('Move failed:', result.message);
        alert(result.message || 'Move failed');
        return false;
      }
    } catch (error) {
      console.error('Error making move:', error);
      alert('Network error. Move failed. Check server connection.');
      return false;
    }
  };

  const checkForGameEnd = () => {
    if (gameEnded || !gameStarted || gameEndCountdown !== null) return;
    
    const gameEndResult = gameService.checkGameEnd(board, currentPlayer, getValidMoves);
    console.log('Game end check result:', gameEndResult);
    
    if (gameEndResult.gameEnded) {
      console.log('Game ended detected:', gameEndResult);
      
      // Show immediate notification for checkmate/stalemate
      if (gameEndResult.reason === 'checkmate') {
        const winner = gameEndResult.result === 'white_wins' ? 'White' : 'Black';
        console.log(`CHECKMATE! ${winner} wins!`);
      } else if (gameEndResult.reason === 'stalemate') {
        console.log('STALEMATE! Game is a draw!');
      }
      
      // Start countdown display
      setGameEndCountdown({
        result: gameEndResult.result,
        reason: gameEndResult.reason,
        countdown: 3
      });
      
      // Start countdown timer
      let countdown = 3;
      const timer = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          setGameEndCountdown(prev => ({ ...prev, countdown }));
        } else {
          clearInterval(timer);
          setCountdownTimer(null);
          handleGameEnd(gameEndResult.result, gameEndResult.reason);
        }
      }, 1000);
      
      setCountdownTimer(timer);
    }
  };

  const handleGameEnd = async (result, reason) => {
    if (gameEnded) return; // Prevent multiple endings
    
    // Clear countdown timer if active
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(null);
    }
    setGameEndCountdown(null);
    
    setGameEnded(true);
    setGameResult({ result, reason });
    setShowGameEndModal(true);
    
    // Calculate game duration
    const gameDurationMinutes = gameStartTime ? Math.round((Date.now() - gameStartTime) / 60000) : 0;
    
    // Determine winner email
    let winnerEmail = null;
    if (result === 'white_wins') {
      winnerEmail = players.find(p => p.color === 'white')?.email;
    } else if (result === 'black_wins') {
      winnerEmail = players.find(p => p.color === 'black')?.email;
    }
    
    try {
      // Finish the game on the server
      const finishResult = await gameService.finishGame(
        roomCode,
        result,
        winnerEmail,
        moveCount,
        gameDurationMinutes
      );
      
      if (finishResult.success && finishResult.data.gameResultData) {
        // Record result in leaderboard
        const leaderboardResult = await leaderboardService.recordGameResult(
          finishResult.data.gameResultData
        );
        
        if (leaderboardResult.success) {
          console.log('Game result recorded in leaderboard successfully');
        } else {
          console.error('Failed to record in leaderboard:', leaderboardResult.error);
        }
      }
    } catch (error) {
      console.error('Error handling game end:', error);
    }
  };

  const handleResign = async () => {
    if (gameEnded || !gameStarted || !myColor) return;
    
    const opponentColor = myColor === 'white' ? 'black' : 'white';
    const winnerEmail = players.find(p => p.color === opponentColor)?.email;
    const result = opponentColor === 'white' ? 'white_wins' : 'black_wins';
    
    await handleGameEnd(result, 'resignation');
  };

  const closeGameEndModal = () => {
    setShowGameEndModal(false);
    // Navigate back to game mode selection after a short delay
    setTimeout(() => {
      navigate('/gamemode');
    }, 1000);
  };

  const handleSquareClick = useCallback(async (row, col) => {
    const piece = board[row][col];

    // Debug logging
    console.log('Square clicked:', { row, col, piece, gameMode, gameStarted, isMyTurn, myColor });

    // For PvP mode, check if it's the player's turn
    if (gameMode === 'pvp' && gameStarted) {
      if (!isMyTurn) {
        console.log('Not your turn, current turn:', gameState?.currentTurn);
        alert(`It's ${gameState?.currentTurn === 'white' ? 'White' : 'Black'}'s turn`);
        return;
      }
    }

    if (selectedSquare) {
      const [sr, sc] = selectedSquare;
      const isValidMove = validMoves.some(([r,c]) => r===row && c===col);
      console.log('Attempting move:', { from: [sr, sc], to: [row, col], isValidMove });
      
      if (isValidMove) {
        // Additional check: ensure move doesn't put own king in check
        const movingPiece = board[sr][sc];
        const playerColor = movingPiece === movingPiece.toUpperCase() ? 'white' : 'black';
        
        if (gameService.wouldMoveExposeKing(board, sr, sc, row, col, playerColor)) {
          alert('That move would put your king in check!');
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }
        
        const success = await makeMove(sr, sc, row, col, board[sr][sc]);
        if (success) {
          // Move was processed successfully
          setSelectedSquare(null);
          setValidMoves([]);
        }
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
      return;
    }

    if (piece && isCurrentPlayerPiece(piece)) {
      // For PvP mode, ensure player can only move their own pieces
      if (gameMode === 'pvp' && myColor) {
        const isPieceWhite = piece === piece.toUpperCase();
        const canMoveThisPiece = (myColor === 'white' && isPieceWhite) || (myColor === 'black' && !isPieceWhite);
        
        console.log('Piece selection check:', { piece, isPieceWhite, myColor, canMoveThisPiece });
        
        if (!canMoveThisPiece) {
          alert(`You can only move ${myColor} pieces`);
          return;
        }
      }
      
      setSelectedSquare([row,col]);
      // Use legal moves instead of just valid moves (considering check)
      const legalMoves = gameService.getLegalMoves(piece, row, col, board, getValidMoves);
      setValidMoves(legalMoves);
      console.log('Selected piece:', piece, 'Legal moves:', legalMoves);
    }
  }, [board, selectedSquare, currentPlayer, validMoves, gameMode, gameStarted, isMyTurn, myColor, roomCode, playerEmail, gameState]);

  const isHighlighted = (r,c) => selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
  const isValidMoveSquare = (r,c) => validMoves.some(([rr,cc]) => rr===r && cc===c);
  
  // Check if a square contains a king in check
  const isKingInCheck = (r, c) => {
    const piece = board[r][c];
    if (!piece || piece.toLowerCase() !== 'k') return false;
    
    const kingColor = piece === piece.toUpperCase() ? 'white' : 'black';
    return gameService.isKingInCheck(board, kingColor, [r, c]);
  };

  return (
    <div className="chess-app">
      <header className="topbar">
        <div className="game-title-section">
          <h1>Chess — {gameMode === 'pvp' ? 'Player vs Player' : gameMode === 'ai' ? 'Player vs AI' : 'Standard'}</h1>
          {roomCode && (
            <div className="room-info">
              <span>Room Code: <strong>{roomCode}</strong></span>
              {playerEmail && <span> | Player: <strong>{playerEmail}</strong></span>}
            </div>
          )}
        </div>

        {/* Player Status Indicator for PvP mode */}
        {gameMode === 'pvp' && roomCode && (
          <div className="players-status">
            {!playerEmail && players.length > 0 && (
              <div className="email-missing-notice">
                <div className="notice-header">⚠️ Player Identification Needed</div>
                <div className="notice-text">
                  Select your player to continue:
                </div>
                <div className="player-selection">
                  {players.map((player, index) => (
                    <button 
                      key={index}
                      className="player-select-btn"
                      onClick={() => {
                        const newUrl = `${window.location.pathname}?roomCode=${roomCode}&email=${encodeURIComponent(player.email)}`;
                        window.history.replaceState({}, '', newUrl);
                        window.location.reload();
                      }}
                    >
                      {player.email} ({player.color})
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {isLoadingRoom ? (
              <div className="loading-status">
                <div className="loading-spinner"></div>
                <span>Loading room...</span>
              </div>
            ) : roomError ? (
              <div className="error-status">
                <span>⚠️ {roomError}</span>
              </div>
            ) : playerEmail ? (
              <div className="players-list">
                <div className="players-header">
                  <span className="players-count">
                    {players.length}/2 Players
                  </span>
                  <div className={`status-indicator ${roomStatus === 'ready' ? 'ready' : 'waiting'}`}>
                    {roomStatus === 'ready' ? '🟢 Ready to Play!' : '🟡 Waiting for Players...'}
                  </div>
                </div>
                
                <div className="players-grid">
                  {/* White Player (Host) */}
                  <div className={`player-slot ${players.find(p => p.color === 'white') ? 'filled' : 'empty'}`}>
                    <div className="player-icon">♔</div>
                    <div className="player-details">
                      <div className="player-role">White (Host)</div>
                      <div className="player-email">
                        {players.find(p => p.color === 'white')?.email || 'Waiting...'}
                      </div>
                    </div>
                    <div className={`connection-status ${players.find(p => p.color === 'white') ? 'connected' : 'disconnected'}`}>
                      {players.find(p => p.color === 'white') ? '✓' : '○'}
                    </div>
                  </div>

                  {/* Black Player (Guest) */}
                  <div className={`player-slot ${players.find(p => p.color === 'black') ? 'filled' : 'empty'}`}>
                    <div className="player-icon">♚</div>
                    <div className="player-details">
                      <div className="player-role">Black (Guest)</div>
                      <div className="player-email">
                        {players.find(p => p.color === 'black')?.email || 'Waiting...'}
                      </div>
                    </div>
                    <div className={`connection-status ${players.find(p => p.color === 'black') ? 'connected' : 'disconnected'}`}>
                      {players.find(p => p.color === 'black') ? '✓' : '○'}
                    </div>
                  </div>
                </div>

                {roomStatus === 'ready' && (
                  <div className="ready-message">
                    🎉 Both players connected! Game can begin.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        <div className="status">
          <div className="turn-info">
            Turn: <strong className={`player-${currentPlayer}`}>{currentPlayer}</strong>
            {gameMode === 'pvp' && myColor && (
              <span className="player-indicator">
                {isMyTurn ? ' (Your turn!)' : ` (${myColor === 'white' ? 'Black' : 'White'}'s turn)`}
              </span>
            )}
            {/* Check warning */}
            {gameService.isKingInCheck(board, currentPlayer) && (
              <span className="check-warning">
                ⚠️ CHECK!
              </span>
            )}
          </div>
          
          {/* Last Move Information */}
          {lastMoveInfo && gameMode === 'pvp' && (
            <div className="last-move-info">
              <div className="move-indicator">
                Last move: <strong>{lastMoveInfo.player}</strong> ({lastMoveInfo.playerColor}) 
                moved <strong>{pieceSymbols[lastMoveInfo.piece] || lastMoveInfo.piece}</strong>
              </div>
            </div>
          )}
          
          {/* Game Status for PvP */}
          {gameMode === 'pvp' && roomStatus && (
            <div className="game-status">
              Status: <strong>{roomStatus === 'in_progress' ? 'Game in Progress' : 
                              roomStatus === 'ready' ? 'Ready to Start' : 
                              'Waiting for Players'}</strong>
            </div>
          )}
        </div>
      </header>

      <main className="board-area">
        <div
          className="board-wrapper"
          role="grid"
          aria-label="Chess board"
          aria-roledescription="8 by 8 chess board"
        >
          <div className="chess-board">
            {board.map((row, ri) => row.map((piece, ci) => {
              const squareClasses = [
                (ri + ci) % 2 === 0 ? 'light' : 'dark',
                isHighlighted(ri,ci) ? 'selected' : '',
                isValidMoveSquare(ri,ci) ? 'valid-move' : '',
                isKingInCheck(ri, ci) ? 'king-in-check' : ''
              ].filter(Boolean).join(' ');
              return (
                <button
                  key={`${ri}-${ci}`}
                  className={`square ${squareClasses}`}
                  onClick={() => handleSquareClick(ri,ci)}
                  aria-label={`Square ${String.fromCharCode(97 + ci)}${8 - ri}${piece ? `, ${pieceSymbols[piece]}` : ''}`}
                  role="gridcell"
                >
                  {piece && <span className={`piece ${piece === piece.toUpperCase() ? 'white-piece' : 'black-piece'}`}>{pieceSymbols[piece]}</span>}
                  {isValidMoveSquare(ri,ci) && <span className="move-dot" aria-hidden="true"></span>}
                </button>
              );
            }))}
          </div>
        </div>
      </main>

      {/* Game Controls */}
      {gameMode === 'pvp' && gameStarted && !gameEnded && (
        <div className="game-controls">
          <div className="game-info">
            <div className="move-counter">
              Moves: {Math.floor(moveCount / 2) + 1}
            </div>
            {gameStartTime && (
              <div className="game-timer">
                Duration: {Math.floor((Date.now() - gameStartTime) / 60000)}m
              </div>
            )}
          </div>
          <div className="control-buttons">
            <button 
              className="btn resign-btn" 
              onClick={handleResign}
              disabled={!isMyTurn}
            >
              Resign
            </button>
          </div>
        </div>
      )}

      {/* Game End Countdown */}
      {gameEndCountdown && (
        <div className="game-end-countdown-overlay">
          <div className="countdown-modal">
            <div className="countdown-content">
              {gameEndCountdown.reason === 'checkmate' ? (
                <>
                  <div className="countdown-icon">👑</div>
                  <h2>CHECKMATE!</h2>
                  <p>
                    {gameEndCountdown.result === 'white_wins' ? 'White' : 'Black'} Wins!
                  </p>
                </>
              ) : gameEndCountdown.reason === 'stalemate' ? (
                <>
                  <div className="countdown-icon">🤝</div>
                  <h2>STALEMATE!</h2>
                  <p>Game is a Draw!</p>
                </>
              ) : (
                <>
                  <div className="countdown-icon">🏁</div>
                  <h2>Game Over!</h2>
                  <p>Reason: {gameEndCountdown.reason}</p>
                </>
              )}
              
              <div className="countdown-timer">
                <div className="countdown-number">{gameEndCountdown.countdown}</div>
                <div className="countdown-text">Game ending in...</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game End Modal */}
      {showGameEndModal && gameResult && (
        <div className="game-end-modal-overlay">
          <div className="game-end-modal">
            <div className="modal-header">
              <h2>Game Over!</h2>
            </div>
            <div className="modal-content">
              <div className="result-display">
                {gameResult.result === 'draw' ? (
                  <>
                    <div className="result-icon">🤝</div>
                    <h3>It's a Draw!</h3>
                    <p>Reason: {gameResult.reason}</p>
                    <div className="points-awarded">
                      <span>Both players earned 50 points</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="result-icon">
                      {gameResult.result === 'white_wins' ? '♔' : '♚'}
                    </div>
                    <h3>
                      {gameResult.result === 'white_wins' ? 'White' : 'Black'} Wins!
                    </h3>
                    <p>Reason: {gameResult.reason}</p>
                    <div className="points-awarded">
                      <div className="winner-points">
                        Winner: +100 points
                      </div>
                      <div className="loser-points">
                        Loser: +0 points
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="game-stats">
                <div className="stat-item">
                  <span>Total Moves:</span>
                  <span>{moveCount}</span>
                </div>
                <div className="stat-item">
                  <span>Duration:</span>
                  <span>
                    {gameStartTime ? Math.floor((Date.now() - gameStartTime) / 60000) : 0}m
                  </span>
                </div>
                <div className="stat-item">
                  <span>Your Color:</span>
                  <span>{myColor}</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn primary" onClick={closeGameEndModal}>
                Back to Game Mode
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="controls">
        <button 
          className="btn" 
          onClick={() => {
            if (gameMode === 'pvp') {
              if (confirm('Reset the game for all players? This cannot be undone.')) {
                // For PvP games, this would need a server endpoint to reset the game
                alert('Game reset functionality for multiplayer coming soon!');
              }
            } else {
              setBoard(initialBoard);
              setSelectedSquare(null);
              setValidMoves([]);
              setCurrentPlayer('white');
              setGameEnded(false);
              setGameResult(null);
              setMoveCount(0);
              setGameStartTime(null);
            }
          }}
          disabled={gameMode === 'pvp' && !gameStarted}
        >
          Reset
        </button>

        <button className="btn alt" onClick={() => navigate('/gamemode')}>Back to menu</button>
      </footer>
    </div>
  );
};

export default Game;
