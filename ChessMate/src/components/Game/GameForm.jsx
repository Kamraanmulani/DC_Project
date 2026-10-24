import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft,
  FaUsers,
  FaEnvelope,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaCopy
} from 'react-icons/fa';
import Confetti from 'react-confetti';
import './GameForm.css';

const GameForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    roomName: '',
    gmail: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [roomCode, setRoomCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [copied, setCopied] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    let interval;
    if (showSuccess && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      navigate(`/gamestartsPvP?roomCode=${roomCode}&email=${encodeURIComponent(formData.gmail.trim())}`);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showSuccess, countdown, roomCode, navigate]);

  // Window dimensions for confetti
  const [windowDimension, setWindowDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const detectSize = () => {
    setWindowDimension({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  useEffect(() => {
    window.addEventListener('resize', detectSize);
    return () => {
      window.removeEventListener('resize', detectSize);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.roomName.trim()) {
      newErrors.roomName = 'Room name is required';
    } else if (formData.roomName.trim().length < 3) {
      newErrors.roomName = 'Room name must be at least 3 characters';
    }
    
    if (!formData.gmail.trim()) {
      newErrors.gmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.gmail)) {
      newErrors.gmail = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateRoomCode = () => {
    return Math.floor(100 + Math.random() * 900).toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/game/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: formData.roomName.trim(),
          gmail: formData.gmail.trim()
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setRoomCode(result.data.roomCode);
        setShowSuccess(true);
        setShowConfetti(true);
        
        // Stop confetti after 4 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 4000);
      } else {
        throw new Error(result.message || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setErrors({ submit: error.message || 'Failed to create room. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/gamemode');
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  const handleClosePopup = () => {
    setShowSuccess(false);
    setShowConfetti(false);
    navigate(`/gamestartsPvP?roomCode=${roomCode}&email=${encodeURIComponent(formData.gmail.trim())}`);
  };

  const handleJoinNow = () => {
    navigate(`/gamestartsPvP?roomCode=${roomCode}&email=${encodeURIComponent(formData.gmail.trim())}`);
  };

  if (showSuccess) {
    return (
      <>
        {/* Confetti Effect */}
        {showConfetti && (
          <Confetti
            width={windowDimension.width}
            height={windowDimension.height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
            colors={['#667eea', '#764ba2', '#4ade80', '#f59e0b', '#ef4444', '#8b5cf6']}
          />
        )}
        
        {/* Success Popup Overlay */}
        <AnimatePresence>
          <div className="popup-overlay">
            <motion.div 
              className="success-popup"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
            >
              {/* Close Button */}
              <button className="close-popup-btn" onClick={handleClosePopup}>
                <FaTimes />
              </button>
              
              {/* Success Icon */}
              <motion.div 
                className="success-icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 500 }}
              >
                <FaCheck />
              </motion.div>
              
              {/* Success Message */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                🎉 Room Created Successfully!
              </motion.h1>
              
              {/* Room Code Display */}
              <motion.div 
                className="room-code-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <span className="room-code-label">Your Game Room Code</span>
                <div className="room-code-display">
                  <div className="room-code-number">{roomCode}</div>
                  <motion.button 
                    className={`copy-btn ${copied ? 'copied' : ''}`}
                    onClick={copyRoomCode}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {copied ? <FaCheck /> : <FaCopy />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </motion.button>
                </div>
              </motion.div>
              
              {/* Instructions */}
              <motion.p 
                className="success-instructions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                Share this code with your friend to start playing together!
              </motion.p>
              
              {/* Action Buttons */}
              <motion.div 
                className="popup-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
              >
                <motion.button
                  className="join-now-btn"
                  onClick={handleJoinNow}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaUsers />
                  <span>Join Game Now</span>
                </motion.button>
                
                <div className="countdown-container">
                  <span>Auto-joining in {countdown}s</span>
                  <div className="countdown-bar">
                    <motion.div 
                      className="countdown-progress"
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 5, ease: "linear" }}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="game-form-container">
      <motion.div 
        className="game-form-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div 
          className="form-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button className="back-button" onClick={handleBackClick}>
            <FaArrowLeft />
            <span>Back</span>
          </button>
          <div className="header-content">
            <div className="header-icon">
              <FaUsers />
            </div>
            <h1>Create Multiplayer Room</h1>
            <p>Set up a room to play against another player</p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form 
          className="game-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="form-group">
            <label htmlFor="roomName">
              <FaUsers className="input-icon" />
              Room Name
            </label>
            <input
              type="text"
              id="roomName"
              name="roomName"
              value={formData.roomName}
              onChange={handleInputChange}
              placeholder="Enter room name (e.g., John's Game Room)"
              className={errors.roomName ? 'error' : ''}
            />
            {errors.roomName && (
              <motion.span 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.roomName}
              </motion.span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="gmail">
              <FaEnvelope className="input-icon" />
              Email
            </label>
            <input
              type="email"
              id="gmail"
              name="gmail"
              value={formData.gmail}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              className={errors.gmail ? 'error' : ''}
            />
            {errors.gmail && (
              <motion.span 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.gmail}
              </motion.span>
            )}
          </div>

          {errors.submit && (
            <motion.div 
              className="submit-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.submit}
            </motion.div>
          )}

          <motion.button
            type="submit"
            className="create-room-button"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
          >
            {isLoading ? (
              <>
                <FaSpinner className="spinning" />
                <span>Creating Room...</span>
              </>
            ) : (
              <>
                <FaUsers />
                <span>Create Room</span>
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Info Section */}
        <motion.div 
          className="info-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="info-card">
            <h3>How it works:</h3>
            <ul>
              <li>Fill in the room details and create your game room</li>
              <li>A unique 3-digit room code will be generated</li>
              <li>Share the room code with your opponent</li>
              <li>Start playing once both players join!</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GameForm;