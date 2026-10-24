import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './GameAI.css';

const GameAI = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const aiTimeoutRef = useRef(null);

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
  const [isThinking, setIsThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, checkmate, stalemate
  const [winner, setWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);

  const pieceSymbols = {
    'K': '♔','Q': '♕','R': '♖','B': '♗','N': '♘','P': '♙',
    'k': '♚','q': '♛','r': '♜','b': '♝','n': '♞','p': '♟'
  };

  const isCurrentPlayerPiece = (piece) => {
    if (!piece) return false;
    return currentPlayer === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
  };

  const isValidPosition = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

  // Check if king is in check
  const isKingInCheck = (board, isWhiteKing) => {
    let kingRow = -1, kingCol = -1;
    const kingPiece = isWhiteKing ? 'K' : 'k';
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === kingPiece) {
          kingRow = r;
          kingCol = c;
          break;
        }
      }
      if (kingRow !== -1) break;
    }
    
    if (kingRow === -1) return false;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && ((isWhiteKing && piece === piece.toLowerCase()) || (!isWhiteKing && piece === piece.toUpperCase()))) {
          const moves = getValidMovesForPiece(piece, r, c, board, false);
          if (moves.some(([mr, mc]) => mr === kingRow && mc === kingCol)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Get valid moves for a piece with optional check validation
  const getValidMovesForPiece = (piece, row, col, board, checkForChecks = true) => {
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
            else { 
              if ((isWhite && t===t.toLowerCase())||(!isWhite && t===t.toUpperCase())) moves.push([nr,nc]); 
              break; 
            }
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
            else { 
              if ((isWhite && t===t.toLowerCase())||(!isWhite && t===t.toUpperCase())) moves.push([nr,nc]); 
              break; 
            }
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
            else { 
              if ((isWhite && t===t.toLowerCase())||(!isWhite && t===t.toUpperCase())) moves.push([nr,nc]); 
              break; 
            }
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

    if (checkForChecks) {
      return moves.filter(([toRow, toCol]) => {
        const testBoard = board.map(r => [...r]);
        testBoard[toRow][toCol] = piece;
        testBoard[row][col] = null;
        return !isKingInCheck(testBoard, isWhite);
      });
    }

    return moves;
  };

  // Simple move evaluation for AI
  const evaluateMove = (piece, from, to, board) => {
    let score = 0;
    
    const pieceValues = {
      'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
    };
    
    // Capture bonus
    const capturedPiece = board[to[0]][to[1]];
    if (capturedPiece) {
      score += pieceValues[capturedPiece.toLowerCase()] * 10;
    }
    
    // Center control bonus
    const centerSquares = [[3,3], [3,4], [4,3], [4,4]];
    if (centerSquares.some(([r, c]) => r === to[0] && c === to[1])) {
      score += 2;
    }
    
    // Development bonus
    if (from[0] === 7 && to[0] < 7) {
      score += 1;
    }
    
    // Avoid edge squares early game
    if (moveHistory.length < 10 && (to[1] === 0 || to[1] === 7)) {
      score -= 1;
    }
    
    return score + Math.random() * 0.1;
  };

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { currentPlayer, isThinking, gameStatus });
    
    if (currentPlayer === 'black' && !isThinking && gameStatus === 'playing') {
      console.log('🚀 Triggering AI move...');
      // Don't call makeAIMove directly to avoid dependency issues
      const triggerAIMove = () => {
        console.log('🤖 AI move function called:', { currentPlayer, isThinking, gameStatus });
        
        if (currentPlayer !== 'black' || isThinking || gameStatus !== 'playing') {
          console.log('🚫 AI move blocked:', { currentPlayer, isThinking, gameStatus });
          return;
        }
        
        console.log('✅ AI starting to think...');
        setIsThinking(true);
        
        const aiMoveDelay = 800 + Math.random() * 700;
        console.log(`⏱️  AI will think for ${aiMoveDelay.toFixed(0)}ms`);
        
        aiTimeoutRef.current = setTimeout(() => {
          console.log('🧠 AI evaluating moves...');
          const allMoves = [];
          
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const piece = board[r][c];
              if (piece && piece === piece.toLowerCase()) {
                const moves = getValidMovesForPiece(piece, r, c, board, true);
                moves.forEach(([toR, toC]) => {
                  allMoves.push({
                    from: [r, c],
                    to: [toR, toC],
                    piece: piece,
                    capturedPiece: board[toR][toC],
                    score: evaluateMove(piece, [r, c], [toR, toC], board)
                  });
                });
              }
            }
          }
          
          console.log(`🎯 AI found ${allMoves.length} possible moves`);
          
          if (allMoves.length === 0) {
            console.log('❌ No moves available - game ending');
            const inCheck = isKingInCheck(board, false);
            setGameStatus(inCheck ? 'checkmate' : 'stalemate');
            setWinner(inCheck ? 'white' : null);
            setIsThinking(false);
            return;
          }
          
          // Choose best moves
          allMoves.sort((a, b) => b.score - a.score);
          const topMoves = allMoves.filter(move => move.score >= allMoves[0].score - 0.5);
          const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
          
          console.log('🎯 AI selected move:', {
            from: selectedMove.from,
            to: selectedMove.to,
            piece: selectedMove.piece,
            score: selectedMove.score.toFixed(2)
          });
          
          // Make the move
          const newBoard = board.map(r => [...r]);
          newBoard[selectedMove.to[0]][selectedMove.to[1]] = selectedMove.piece;
          newBoard[selectedMove.from[0]][selectedMove.from[1]] = null;
          
          setBoard(newBoard);
          setLastMove({ from: selectedMove.from, to: selectedMove.to });
          setMoveHistory(prev => [...prev, { from: selectedMove.from, to: selectedMove.to, piece: selectedMove.piece }]);
          setCurrentPlayer('white');
          setIsThinking(false);
          aiTimeoutRef.current = null; // Clear the ref
          
          console.log('✅ AI move completed, switching to white player');
          
          // Check for game end for white
          setTimeout(() => {
            const whiteMoves = [];
            for (let r = 0; r < 8; r++) {
              for (let c = 0; c < 8; c++) {
                const piece = newBoard[r][c];
                if (piece && piece === piece.toUpperCase()) {
                  const moves = getValidMovesForPiece(piece, r, c, newBoard, true);
                  whiteMoves.push(...moves);
                }
              }
            }
            
            if (whiteMoves.length === 0) {
              const inCheck = isKingInCheck(newBoard, true);
              setGameStatus(inCheck ? 'checkmate' : 'stalemate');
              setWinner(inCheck ? 'black' : null);
            }
          }, 100);
          
        }, aiMoveDelay);
      };
      
      triggerAIMove();
    } else {
      console.log('⏸️  Not triggering AI move:', { 
        isBlackTurn: currentPlayer === 'black',
        notThinking: !isThinking,
        gameIsPlaying: gameStatus === 'playing'
      });
    }
  }, [currentPlayer, isThinking, gameStatus]); // Remove makeAIMove from dependencies

  // Cleanup timeout on component unmount only
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        console.log('🧹 Component unmounting - cleaning up AI timeout');
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  const getValidMoves = (piece, row, col, board) => {
    return getValidMovesForPiece(piece, row, col, board, true);
  };

  const handleSquareClick = useCallback((row, col) => {
    console.log('🖱️  Square clicked:', { row, col, currentPlayer, isThinking, gameStatus });
    
    if (currentPlayer !== 'white' || isThinking || gameStatus !== 'playing') {
      console.log('🚫 Click ignored:', { currentPlayer, isThinking, gameStatus });
      return;
    }
    
    const piece = board[row][col];

    if (selectedSquare) {
      const [sr, sc] = selectedSquare;
      const isValidMove = validMoves.some(([r,c]) => r===row && c===col);
      if (isValidMove) {
        console.log('✅ Making player move from', [sr, sc], 'to', [row, col]);
        
        const newBoard = board.map(r => [...r]);
        const movedPiece = board[sr][sc];
        newBoard[row][col] = movedPiece;
        newBoard[sr][sc] = null;
        
        setBoard(newBoard);
        setLastMove({ from: [sr, sc], to: [row, col] });
        setMoveHistory(prev => [...prev, { from: [sr, sc], to: [row, col], piece: movedPiece }]);
        setCurrentPlayer('black');
        
        console.log('🔄 Switched to black player (AI turn)');
        
        // Check for checkmate/stalemate for black
        setTimeout(() => {
          const blackMoves = [];
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const piece = newBoard[r][c];
              if (piece && piece === piece.toLowerCase()) {
                const moves = getValidMovesForPiece(piece, r, c, newBoard, true);
                blackMoves.push(...moves);
              }
            }
          }
          
          if (blackMoves.length === 0) {
            const inCheck = isKingInCheck(newBoard, false);
            setGameStatus(inCheck ? 'checkmate' : 'stalemate');
            setWinner(inCheck ? 'white' : null);
          }
        }, 100);
      }
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    if (piece && isCurrentPlayerPiece(piece)) {
      console.log('🎯 Selected piece:', piece, 'at', [row, col]);
      setSelectedSquare([row,col]);
      const moves = getValidMoves(piece, row, col, board);
      setValidMoves(moves);
      console.log('📍 Valid moves:', moves.length);
    }
  }, [board, selectedSquare, currentPlayer, validMoves, isThinking, gameStatus]);

  const resetGame = () => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }
    setBoard(initialBoard);
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentPlayer('white');
    setIsThinking(false);
    setGameStatus('playing');
    setWinner(null);
    setLastMove(null);
    setMoveHistory([]);
  };

  const isHighlighted = (r,c) => selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
  const isValidMoveSquare = (r,c) => validMoves.some(([rr,cc]) => rr===r && cc===c);
  const isLastMoveSquare = (r,c) => lastMove && ((lastMove.from[0] === r && lastMove.from[1] === c) || (lastMove.to[0] === r && lastMove.to[1] === c));

  return (
    <div className="chess-app">
      <header className="topbar">
        <h1>Chess — Player vs AI</h1>
        <div className="status">
          {gameStatus === 'playing' ? (
            <>
              Turn: <strong className={`player-${currentPlayer}`}>
                {currentPlayer === 'white' ? 'You' : 'AI'}
              </strong>
              {isThinking && <span className="thinking"> (AI is thinking...)</span>}
            </>
          ) : (
            <div className="game-over">
              {gameStatus === 'checkmate' && winner && (
                <span className={winner === 'white' ? 'win' : 'lose'}>
                  {winner === 'white' ? '🎉 You Win!' : '💔 AI Wins!'}
                </span>
              )}
              {gameStatus === 'stalemate' && <span className="draw">🤝 Draw!</span>}
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
                isLastMoveSquare(ri,ci) ? 'last-move' : ''
              ].join(' ');
              return (
                <button
                  key={`${ri}-${ci}`}
                  className={`square ${squareClasses}`}
                  onClick={() => handleSquareClick(ri,ci)}
                  aria-label={`Square ${String.fromCharCode(97 + ci)}${8 - ri}${piece ? `, ${pieceSymbols[piece]}` : ''}`}
                  role="gridcell"
                  disabled={isThinking || gameStatus !== 'playing' || currentPlayer !== 'white'}
                >
                  {piece && <span className={`piece ${piece === piece.toUpperCase() ? 'white-piece' : 'black-piece'} ${isThinking && currentPlayer === 'black' ? 'ai-piece' : ''}`}>{pieceSymbols[piece]}</span>}
                  {isValidMoveSquare(ri,ci) && <span className="move-dot" aria-hidden="true"></span>}
                </button>
              );
            }))}
          </div>
        </div>
      </main>

      <footer className="controls">
        <div className="game-info">
          <span className="move-count">Moves: {moveHistory.length}</span>
        </div>
        <div className="control-buttons">
          <button className="btn" onClick={resetGame}>
            {gameStatus === 'playing' ? 'Reset Game' : 'New Game'}
          </button>
          <button className="btn alt" onClick={() => navigate('/gamemode')}>
            Back to Menu
          </button>
        </div>
      </footer>
    </div>
  );
};

export default GameAI;
