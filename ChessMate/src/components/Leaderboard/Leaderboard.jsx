import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTrophy, 
  FaMedal, 
  FaStar, 
  FaChartLine, 
  FaGamepad,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaSpinner,
  FaSyncAlt,
  FaUser,
  FaCalendarAlt
} from 'react-icons/fa';
import './Leaderboard.css';

const Leaderboard = ({ playerEmail = null, showHeader = true }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    if (playerEmail) {
      fetchPlayerStats();
    }
  }, [currentPage, playerEmail]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/leaderboard?page=${currentPage}&limit=10`);
      const result = await response.json();

      if (response.ok) {
        setLeaderboardData(result.data.leaderboard);
        setTotalPages(result.data.pagination.totalPages);
        setError('');
      } else {
        setError(result.message || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerStats = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/leaderboard/player/${encodeURIComponent(playerEmail)}`);
      const result = await response.json();

      if (response.ok) {
        setPlayerStats(result.data.player);
      } else {
        console.log('Player not found in leaderboard');
      }
    } catch (err) {
      console.error('Error fetching player stats:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    if (playerEmail) {
      await fetchPlayerStats();
    }
    setRefreshing(false);
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="rank-icon gold" />;
      case 2:
        return <FaMedal className="rank-icon silver" />;
      case 3:
        return <FaMedal className="rank-icon bronze" />;
      default:
        return <span className="rank-number">#{rank}</span>;
    }
  };

  const getRankClass = (rank) => {
    if (rank <= 3) return `rank-${rank}`;
    if (rank <= 10) return 'rank-top10';
    return 'rank-regular';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  if (loading && leaderboardData.length === 0) {
    return (
      <div className="leaderboard-container loading">
        <div className="loading-content">
          <FaSpinner className="spinning" />
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="leaderboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {showHeader && (
        <motion.div className="leaderboard-header" variants={itemVariants}>
          <div className="header-content">
            <div className="header-title">
              <FaTrophy className="header-icon" />
              <h2>Global Leaderboard</h2>
            </div>
            <button 
              className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <FaSyncAlt className={refreshing ? 'spinning' : ''} />
              <span>Refresh</span>
            </button>
          </div>
          <p>Top players ranked by total points earned</p>
        </motion.div>
      )}

      {/* Player Stats Card (if playerEmail provided) */}
      {playerStats && (
        <motion.div className="player-stats-card" variants={itemVariants}>
          <div className="stats-header">
            <FaUser className="stats-icon" />
            <h3>Your Stats</h3>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Rank</span>
              <span className="stat-value">#{playerStats.rank}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Points</span>
              <span className="stat-value">{playerStats.total_points}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Win Rate</span>
              <span className="stat-value">{playerStats.win_percentage}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Games</span>
              <span className="stat-value">{playerStats.games_played}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Streak</span>
              <span className="stat-value">{playerStats.current_streak}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Best Streak</span>
              <span className="stat-value">{playerStats.best_streak}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Leaderboard Table */}
      <motion.div className="leaderboard-table-container" variants={itemVariants}>
        <div className="table-header">
          <div className="header-cell rank-header">Rank</div>
          <div className="header-cell player-header">Player</div>
          <div className="header-cell points-header">Points</div>
          <div className="header-cell games-header">Games</div>
          <div className="header-cell wins-header">Wins</div>
          <div className="header-cell winrate-header">Win Rate</div>
          <div className="header-cell streak-header">Streak</div>
          <div className="header-cell lastgame-header">Last Game</div>
        </div>

        <AnimatePresence mode="wait">
          {leaderboardData.length > 0 ? (
            <motion.div className="leaderboard-rows">
              {leaderboardData.map((player, index) => (
                <motion.div
                  key={player.player_email}
                  className={`leaderboard-row ${getRankClass(player.rank)} ${
                    playerEmail === player.player_email ? 'current-player' : ''
                  }`}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <div className="row-cell rank-cell">
                    {getRankIcon(player.rank)}
                  </div>
                  
                  <div className="row-cell player-cell">
                    <div className="player-info">
                      <span className="player-name">
                        {player.player_name || player.player_email.split('@')[0]}
                      </span>
                      <span className="player-email">{player.player_email}</span>
                    </div>
                  </div>
                  
                  <div className="row-cell points-cell">
                    <span className="points-value">{player.total_points}</span>
                    <FaStar className="points-icon" />
                  </div>
                  
                  <div className="row-cell games-cell">
                    <span className="games-value">{player.games_played}</span>
                  </div>
                  
                  <div className="row-cell wins-cell">
                    <div className="wins-breakdown">
                      <span className="wins-count">{player.games_won}</span>
                      <div className="wins-details">
                        <span className="draws">D: {player.games_drawn}</span>
                        <span className="losses">L: {player.games_lost}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row-cell winrate-cell">
                    <div className="winrate-display">
                      <span className="winrate-percent">{player.win_percentage}%</span>
                      <div className="winrate-bar">
                        <div 
                          className="winrate-fill"
                          style={{ width: `${player.win_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row-cell streak-cell">
                    <div className="streak-display">
                      <span className="current-streak">{player.current_streak}</span>
                      <span className="best-streak">({player.best_streak})</span>
                    </div>
                  </div>
                  
                  <div className="row-cell lastgame-cell">
                    <div className="lastgame-info">
                      <FaCalendarAlt className="date-icon" />
                      <span>{formatDate(player.last_game_date)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="empty-leaderboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <FaGamepad className="empty-icon" />
              <h3>No Players Yet</h3>
              <p>Be the first to play and claim the top spot!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div className="pagination" variants={itemVariants}>
          <button
            className="page-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <FaArrowUp className="rotated-left" />
            <span>Previous</span>
          </button>
          
          <div className="page-info">
            <span>Page {currentPage} of {totalPages}</span>
          </div>
          
          <button
            className="page-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <span>Next</span>
            <FaArrowUp className="rotated-right" />
          </button>
        </motion.div>
      )}

      {/* Legend */}
      <motion.div className="leaderboard-legend" variants={itemVariants}>
        <h4>Scoring System</h4>
        <div className="legend-items">
          <div className="legend-item">
            <FaTrophy className="legend-icon win" />
            <span>Win: 100 points</span>
          </div>
          <div className="legend-item">
            <FaMinus className="legend-icon draw" />
            <span>Draw: 50 points</span>
          </div>
          <div className="legend-item">
            <FaArrowDown className="legend-icon loss" />
            <span>Loss: 0 points</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Leaderboard;