import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import GameModeSelection from './components/GameMode/GameModeSelection'
import GameForm from './components/Game/GameForm'
// import Game from './components/Game/Game'
import GameAI from './components/Game/GameAI'
import GamePvP from './components/Game/GamePvP'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gamemode" element={<GameModeSelection />} />
            <Route path="/gameform" element={<GameForm />} />
            {/* <Route path="/gamestarts" element={<Game />} /> */}
            <Route path="/gamestartsAI" element={<GameAI />} />
            <Route path="/gamestartsPvP" element={<GamePvP />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
