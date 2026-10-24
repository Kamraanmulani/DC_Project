import React from 'react'
import { FaPlay, FaStar, FaTrophy } from 'react-icons/fa'
import { motion } from 'framer-motion'

const Hero = ({ onStartPlaying }) => {
  return (
    <section className="hero">
      <div className="hero-container">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="hero-title">
            Master Chess with 
            <span className="gradient-text"> ChessMate</span>
          </h1>
          <p className="hero-description">
            The ultimate chess platform where strategy meets technology. 
            Play, learn, and compete with players worldwide in a beautiful, 
            intuitive environment designed for chess enthusiasts of all levels.
          </p>
          
          <div className="hero-stats">
            <div className="stat">
              <FaStar className="stat-icon" />
              <span className="stat-number">50K+</span>
              <span className="stat-label">Active Players</span>
            </div>
            <div className="stat">
              <FaTrophy className="stat-icon" />
              <span className="stat-number">100K+</span>
              <span className="stat-label">Games Played</span>
            </div>
            <div className="stat">
              <FaPlay className="stat-icon" />
              <span className="stat-number">24/7</span>
              <span className="stat-label">Live Games</span>
            </div>
          </div>

          <div className="hero-actions">
            <button 
              className="btn btn-primary btn-large"
              onClick={onStartPlaying}
            >
              <FaPlay className="btn-icon" />
              Start Playing Now
            </button>
            <button className="btn btn-outline btn-large">
              Watch Demo
            </button>
          </div>
        </motion.div>

        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* <div className="chess-board">
            <div className="board-grid">
              {Array.from({ length: 64 }).map((_, index) => (
                <div 
                  key={index} 
                  className={`square ${(Math.floor(index / 8) + index) % 2 === 0 ? 'light' : 'dark'}`}
                >
                  {index === 28 && <span className="piece">♔</span>}
                  {index === 35 && <span className="piece">♛</span>}
                  {index === 20 && <span className="piece">♖</span>}
                  {index === 43 && <span className="piece">♗</span>}
                  {index === 12 && <span className="piece">♘</span>}
                  {index === 51 && <span className="piece">♙</span>}
                </div>
              ))}
            </div>
          </div> */}
        </motion.div>
      </div>
    </section>
  )
}

export default Hero