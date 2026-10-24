import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaRobot, 
  FaArrowLeft,
  FaStar,
  FaGamepad,
  FaSignInAlt,
  FaPlus,
  FaTimes,
  FaSpinner,
  FaTrophy
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import Leaderboard from '../Leaderboard/Leaderboard';
import './GameModeSelection.css';

const GameModeSelection = () => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const gameModes = [
    {
      id: 'multiplayer',
      title: 'Play vs Player',
      subtitle: 'Challenge another human player',
      icon: FaUsers,
      color: '#e74c3c',
      description: 'Test your skills against real opponents from around the world',
      features: ['Ranked matches', 'Real-time play', 'Chat with opponent']
    },
    {
      id: 'ai',
      title: 'Play vs AI',
      subtitle: 'Challenge our intelligent bot',
      icon: FaRobot,
      color: '#3498db',
      description: 'Practice and improve against our advanced chess engine',
      features: ['Multiple difficulty levels', 'Instant gameplay', 'Perfect for learning']
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4 }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  const handleStartGame = () => {
    if (selectedMode) {
      // Navigate to the appropriate game page based on selected mode
      if (selectedMode === 'ai') {
        navigate('/gamestartsAI');
      } else if (selectedMode === 'multiplayer') {
        navigate('/gameform');
      }
    }
  };

  const handleJoinRoom = () => {
    setShowJoinRoom(true);
  };

  const handleJoinRoomSubmit = async (e) => {
    e.preventDefault();
    
    if (!roomCode.trim() || !playerEmail.trim()) {
      setJoinError('Please enter both room code and email');
      return;
    }

    if (roomCode.length !== 3 || !/^\d{3}$/.test(roomCode)) {
      setJoinError('Room code must be a 3-digit number');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(playerEmail)) {
      setJoinError('Please enter a valid email address');
      return;
    }

    setIsJoining(true);
    setJoinError('');

    try {
      const response = await fetch(`http://localhost:5000/api/game/room/${roomCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gmail: playerEmail.trim()
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Successfully joined room, navigate to game
        navigate(`/gamestartsPvP?roomCode=${roomCode}&email=${playerEmail.trim()}`);
      } else {
        setJoinError(result.message || 'Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setJoinError('Network error. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCloseJoinModal = () => {
    setShowJoinRoom(false);
    setRoomCode('');
    setPlayerEmail('');
    setJoinError('');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleShowLeaderboard = () => {
    setShowLeaderboard(true);
  };

  const handleHideLeaderboard = () => {
    setShowLeaderboard(false);
  };

  return (
    <div className="game-mode-container">
      <motion.div 
        className="game-mode-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="game-mode-header" variants={cardVariants}>
          <div className="header-top">
            <button className="back-button" onClick={handleBackToHome}>
              <FaArrowLeft />
              <span>Back to Home</span>
            </button>
            <button className="leaderboard-button" onClick={handleShowLeaderboard}>
              <FaTrophy />
              <span>Leaderboard</span>
            </button>
          </div>
          <h1>Choose Your Game Mode</h1>
          <p>Select how you want to play and start your chess journey</p>
        </motion.div>

        {/* Game Mode Selection */}
        <motion.div className="game-modes-grid" variants={cardVariants}>
          {gameModes.map((mode) => (
            <motion.div
              key={mode.id}
              className={`game-mode-card ${selectedMode === mode.id ? 'selected' : ''}`}
              variants={cardVariants}
              whileHover="hover"
              onClick={() => handleModeSelect(mode.id)}
            >
              <div className="mode-card-header">
                <div 
                  className="mode-icon"
                  style={{ backgroundColor: mode.color }}
                >
                  <mode.icon />
                </div>
                <div className="mode-info">
                  <h3>{mode.title}</h3>
                  <p>{mode.subtitle}</p>
                </div>
                {selectedMode === mode.id && (
                  <motion.div 
                    className="selected-indicator"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <FaStar />
                  </motion.div>
                )}
              </div>
              
              <div className="mode-description">
                <p>{mode.description}</p>
              </div>
              
              <div className="mode-features">
                {mode.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <span className="feature-dot"></span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Multiplayer-specific action buttons */}
              {mode.id === 'multiplayer' && (
                <div className="multiplayer-actions">
                  <motion.button
                    className="action-btn create-room-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/gameform');
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPlus />
                    <span>Create Room</span>
                  </motion.button>
                  
                  <motion.button
                    className="action-btn join-room-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinRoom();
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaSignInAlt />
                    <span>Join Room</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Start Game Button */}
        {selectedMode && (
          <motion.div 
            className="start-game-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              className="start-game-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartGame}
            >
              <FaGamepad />
              <span>Start Game</span>
              <motion.div 
                className="button-glow"
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <div className="modal-overlay leaderboard-modal-overlay">
            <motion.div 
              className="leaderboard-modal"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
            >
              <div className="modal-header leaderboard-modal-header">
                <h2>Global Leaderboard</h2>
                <button className="close-modal-btn" onClick={handleHideLeaderboard}>
                  <FaTimes />
                </button>
              </div>
              <div className="leaderboard-modal-content">
                <Leaderboard 
                  playerEmail={user?.email} 
                  showHeader={false}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Room Modal */}
      <AnimatePresence>
        {showJoinRoom && (
          <div className="modal-overlay">
            <motion.div 
              className="join-room-modal"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
            >
              <div className="modal-header">
                <h2>Join Game Room</h2>
                <button className="close-modal-btn" onClick={handleCloseJoinModal}>
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleJoinRoomSubmit} className="join-room-form">
                <div className="form-group">
                  <label htmlFor="roomCode">Room Code</label>
                  <input
                    type="text"
                    id="roomCode"
                    value={roomCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                      setRoomCode(value);
                      if (joinError) setJoinError('');
                    }}
                    placeholder="Enter 3-digit room code"
                    maxLength="3"
                    className={joinError ? 'error' : ''}
                    disabled={isJoining}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="playerEmail">Your Email</label>
                  <input
                    type="email"
                    id="playerEmail"
                    value={playerEmail}
                    onChange={(e) => {
                      setPlayerEmail(e.target.value);
                      if (joinError) setJoinError('');
                    }}
                    placeholder="Enter your email address"
                    className={joinError ? 'error' : ''}
                    disabled={isJoining}
                  />
                </div>

                {joinError && (
                  <motion.div 
                    className="join-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {joinError}
                  </motion.div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleCloseJoinModal}
                    disabled={isJoining}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-join"
                    disabled={isJoining || !roomCode || !playerEmail}
                  >
                    {isJoining ? (
                      <>
                        <FaSpinner className="spinning" />
                        <span>Joining...</span>
                      </>
                    ) : (
                      <>
                        <FaSignInAlt />
                        <span>Join Room</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameModeSelection;