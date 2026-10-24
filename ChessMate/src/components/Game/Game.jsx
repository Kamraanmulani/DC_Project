// import React, { useState, useCallback } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import './Game.css'; // make sure filename/casing matches

// const Game = () => {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const gameMode = location.pathname.includes('AI') ? 'ai' :
//                    location.pathname.includes('PvP') ? 'pvp' : 'standard';

//   const initialBoard = [
//     ['r','n','b','q','k','b','n','r'],
//     ['p','p','p','p','p','p','p','p'],
//     [null,null,null,null,null,null,null,null],
//     [null,null,null,null,null,null,null,null],
//     [null,null,null,null,null,null,null,null],
//     [null,null,null,null,null,null,null,null],
//     ['P','P','P','P','P','P','P','P'],
//     ['R','N','B','Q','K','B','N','R']
//   ];

//   const [board, setBoard] = useState(initialBoard);
//   const [selectedSquare, setSelectedSquare] = useState(null);
//   const [currentPlayer, setCurrentPlayer] = useState('white');
//   const [validMoves, setValidMoves] = useState([]);

//   const pieceSymbols = {
//     'K': '♔','Q': '♕','R': '♖','B': '♗','N': '♘','P': '♙',
//     'k': '♚','q': '♛','r': '♜','b': '♝','n': '♞','p': '♟'
//   };

//   const isCurrentPlayerPiece = (piece) => {
//     if (!piece) return false;
//     return currentPlayer === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
//   };

//   const isValidPosition = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

//   // getValidMoves (same logic you had, unchanged) - for brevity I reuse original working logic
//   const getValidMoves = (piece, row, col, board) => {
//     const moves = [];
//     if (!piece) return moves;
//     const isWhite = piece === piece.toUpperCase();
//     switch (piece.toLowerCase()) {
//       case 'p': {
//         const direction = isWhite ? -1 : 1;
//         const startRow = isWhite ? 6 : 1;
//         if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
//           moves.push([row + direction, col]);
//           if (row === startRow && !board[row + 2 * direction][col]) {
//             moves.push([row + 2 * direction, col]);
//           }
//         }
//         for (const colOffset of [-1, 1]) {
//           const newCol = col + colOffset;
//           if (isValidPosition(row + direction, newCol) && board[row + direction][newCol]) {
//             const target = board[row + direction][newCol];
//             if ((isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase())) {
//               moves.push([row + direction, newCol]);
//             }
//           }
//         }
//         break;
//       }
//       case 'r': {
//         const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
//         for (const [dr,dc] of dirs) {
//           for (let i=1;i<8;i++){
//             const nr=row+i*dr, nc=col+i*dc;
//             if (!isValidPosition(nr,nc)) break;
//             const t = board[nr][nc];
//             if (!t) moves.push([nr,nc]);
//             else { if ((isWhite && t===t.toLowerCase())||(!isWhite && t===t.toUpperCase())) moves.push([nr,nc]); break; }
//           }
//         }
//         break;
//       }
//       case 'n': {
//         const kMoves=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
//         for (const [dr,dc] of kMoves){
//           const nr=row+dr, nc=col+dc;
//           if (!isValidPosition(nr,nc)) continue;
//           const t = board[nr][nc];
//           if (!t || (isWhite && t===t.toLowerCase()) || (!isWhite && t===t.toUpperCase())) moves.push([nr,nc]);
//         }
//         break;
//       }
//       case 'b': {
//         const dirs=[[1,1],[1,-1],[-1,1],[-1,-1]];
//         for (const [dr,dc] of dirs) {
//           for (let i=1;i<8;i++){
//             const nr=row+i*dr, nc=col+i*dc;
//             if (!isValidPosition(nr,nc)) break;
//             const t=board[nr][nc];
//             if (!t) moves.push([nr,nc]);
//             else { if ((isWhite && t===t.toLowerCase())||(!isWhite && t===t.toUpperCase())) moves.push([nr,nc]); break; }
//           }
//         }
//         break;
//       }
//       case 'q': {
//         const dirs=[[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
//         for (const [dr,dc] of dirs) {
//           for (let i=1;i<8;i++){
//             const nr=row+i*dr, nc=col+i*dc;
//             if (!isValidPosition(nr,nc)) break;
//             const t=board[nr][nc];
//             if (!t) moves.push([nr,nc]);
//             else { if ((isWhite && t===t.toLowerCase())||(!isWhite && t===t.toUpperCase())) moves.push([nr,nc]); break; }
//           }
//         }
//         break;
//       }
//       case 'k': {
//         const km=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
//         for (const [dr,dc] of km) {
//           const nr=row+dr, nc=col+dc;
//           if (!isValidPosition(nr,nc)) continue;
//           const t=board[nr][nc];
//           if (!t || (isWhite && t===t.toLowerCase()) || (!isWhite && t===t.toUpperCase())) moves.push([nr,nc]);
//         }
//         break;
//       }
//       default: break;
//     }
//     return moves;
//   };

//   const handleSquareClick = useCallback((row, col) => {
//     const piece = board[row][col];

//     if (selectedSquare) {
//       const [sr, sc] = selectedSquare;
//       const isValidMove = validMoves.some(([r,c]) => r===row && c===col);
//       if (isValidMove) {
//         const newBoard = board.map(r => [...r]);
//         newBoard[row][col] = board[sr][sc];
//         newBoard[sr][sc] = null;
//         setBoard(newBoard);
//         setCurrentPlayer(prev => prev === 'white' ? 'black' : 'white');
//       }
//       setSelectedSquare(null);
//       setValidMoves([]);
//       return;
//     }

//     if (piece && isCurrentPlayerPiece(piece)) {
//       setSelectedSquare([row,col]);
//       const moves = getValidMoves(piece, row, col, board);
//       setValidMoves(moves);
//     }
//   }, [board, selectedSquare, currentPlayer, validMoves]);

//   const isHighlighted = (r,c) => selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
//   const isValidMoveSquare = (r,c) => validMoves.some(([rr,cc]) => rr===r && cc===c);

//   return (
//     <div className="chess-app">
//       <header className="topbar">
//         <h1>Chess — {gameMode === 'pvp' ? 'Player vs Player' : gameMode === 'ai' ? 'Player vs AI' : 'Standard'}</h1>
//         <div className="status">Turn: <strong className={`player-${currentPlayer}`}>{currentPlayer}</strong></div>
//       </header>

//       <main className="board-area">
//         <div
//           className="board-wrapper"
//           role="grid"
//           aria-label="Chess board"
//           aria-roledescription="8 by 8 chess board"
//         >
//           <div className="chess-board">
//             {board.map((row, ri) => row.map((piece, ci) => {
//               const squareClasses = [
//                 (ri + ci) % 2 === 0 ? 'light' : 'dark',
//                 isHighlighted(ri,ci) ? 'selected' : '',
//                 isValidMoveSquare(ri,ci) ? 'valid-move' : ''
//               ].join(' ');
//               return (
//                 <button
//                   key={`${ri}-${ci}`}
//                   className={`square ${squareClasses}`}
//                   onClick={() => handleSquareClick(ri,ci)}
//                   aria-label={`Square ${String.fromCharCode(97 + ci)}${8 - ri}${piece ? `, ${pieceSymbols[piece]}` : ''}`}
//                   role="gridcell"
//                 >
//                   {piece && <span className={`piece ${piece === piece.toUpperCase() ? 'white-piece' : 'black-piece'}`}>{pieceSymbols[piece]}</span>}
//                   {isValidMoveSquare(ri,ci) && <span className="move-dot" aria-hidden="true"></span>}
//                 </button>
//               );
//             }))}
//           </div>
//         </div>
//       </main>

//       <footer className="controls">
//         <button className="btn" onClick={() => {
//           setBoard(initialBoard);
//           setSelectedSquare(null);
//           setValidMoves([]);
//           setCurrentPlayer('white');
//         }}>Reset</button>

//         <button className="btn alt" onClick={() => navigate('/gamemode')}>Back to menu</button>
//       </footer>
//     </div>
//   );
// };

// export default Game;
