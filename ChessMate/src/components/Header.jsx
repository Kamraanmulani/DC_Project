import React, { useState } from 'react'
import { FaChess, FaBars, FaTimes, FaUser, FaSignOutAlt } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './Auth/AuthModal'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalView, setAuthModalView] = useState('login')
  const { isAuthenticated, user, logout } = useAuth()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const openAuthModal = (view = 'login') => {
    setAuthModalView(view)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      <motion.header 
        className="header"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-container">
          <div className="logo">
            <FaChess className="logo-icon" />
            <span className="logo-text">ChessMate</span>
          </div>
          
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#contact" className="nav-link">Contact</a>
          </nav>

          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <div className="user-menu">
                  <span className="user-greeting">
                    <FaUser className="user-icon" />
                    {user?.username}
                  </span>
                  <button 
                    className="btn btn-outline"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <FaSignOutAlt />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <button 
                  className="btn btn-outline"
                  onClick={() => openAuthModal('login')}
                >
                  Login
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => openAuthModal('signup')}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          <button className="menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </motion.header>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialView={authModalView}
      />
    </>
  )
}

export default Header