import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// GET /api/leaderboard - Get leaderboard with rankings
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get leaderboard data with ranking
    const leaderboardQuery = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY total_points DESC, games_won DESC, (games_won::FLOAT / NULLIF(games_played, 0)) DESC) as rank,
        player_email,
        player_name,
        total_points,
        games_played,
        games_won,
        games_drawn,
        games_lost,
        current_streak,
        best_streak,
        last_game_date,
        CASE 
          WHEN games_played = 0 THEN 0 
          ELSE CAST(ROUND(CAST((games_won::FLOAT / games_played) * 100 AS NUMERIC), 1) AS FLOAT) 
        END as win_percentage
      FROM leaderboard 
      WHERE games_played > 0
      ORDER BY total_points DESC, games_won DESC, win_percentage DESC
      LIMIT $1 OFFSET $2
    `;

    const totalCountQuery = `
      SELECT COUNT(*) as total 
      FROM leaderboard 
      WHERE games_played > 0
    `;

    const [leaderboardResult, countResult] = await Promise.all([
      query(leaderboardQuery, [limit, offset]),
      query(totalCountQuery)
    ]);

    const totalPlayers = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalPlayers / limit);

    res.status(200).json({
      status: 'success',
      message: 'Leaderboard retrieved successfully',
      data: {
        leaderboard: leaderboardResult.rows,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalPlayers: totalPlayers,
          playersPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving leaderboard:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve leaderboard'
    });
  }
});

// GET /api/leaderboard/player/:email - Get specific player's stats and rank
router.get('/player/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Get player's stats and rank
    const playerQuery = `
      SELECT 
        player_email,
        player_name,
        total_points,
        games_played,
        games_won,
        games_drawn,
        games_lost,
        current_streak,
        best_streak,
        last_game_date,
        CASE 
          WHEN games_played = 0 THEN 0 
          ELSE CAST(ROUND(CAST((games_won::FLOAT / games_played) * 100 AS NUMERIC), 1) AS FLOAT) 
        END as win_percentage,
        (SELECT COUNT(*) + 1 
         FROM leaderboard l2 
         WHERE l2.total_points > l1.total_points 
         AND l2.games_played > 0) as rank
      FROM leaderboard l1
      WHERE player_email = $1
    `;

    const playerResult = await query(playerQuery, [email]);

    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Player not found in leaderboard'
      });
    }

    // Get recent game history for this player
    const recentGamesQuery = `
      SELECT 
        room_code,
        game_id,
        player_white_email,
        player_black_email,
        winner_email,
        game_result,
        CASE 
          WHEN player_white_email = $1 THEN points_awarded_white
          ELSE points_awarded_black
        END as points_earned,
        total_moves,
        completed_at
      FROM game_results 
      WHERE player_white_email = $1 OR player_black_email = $1
      ORDER BY completed_at DESC
      LIMIT 5
    `;

    const recentGamesResult = await query(recentGamesQuery, [email]);

    res.status(200).json({
      status: 'success',
      message: 'Player stats retrieved successfully',
      data: {
        player: playerResult.rows[0],
        recentGames: recentGamesResult.rows
      }
    });

  } catch (error) {
    console.error('Error retrieving player stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve player stats'
    });
  }
});

// GET /api/leaderboard/top/:count - Get top N players
router.get('/top/:count', async (req, res) => {
  try {
    const count = Math.min(parseInt(req.params.count) || 10, 100); // Max 100 players

    const topPlayersQuery = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY total_points DESC, games_won DESC, (games_won::FLOAT / NULLIF(games_played, 0)) DESC) as rank,
        player_email,
        player_name,
        total_points,
        games_played,
        games_won,
        games_drawn,
        games_lost,
        current_streak,
        best_streak,
        CASE 
          WHEN games_played = 0 THEN 0 
          ELSE CAST(ROUND(CAST((games_won::FLOAT / games_played) * 100 AS NUMERIC), 1) AS FLOAT) 
        END as win_percentage
      FROM leaderboard 
      WHERE games_played > 0
      ORDER BY total_points DESC, games_won DESC, win_percentage DESC
      LIMIT $1
    `;

    const result = await query(topPlayersQuery, [count]);

    res.status(200).json({
      status: 'success',
      message: `Top ${count} players retrieved successfully`,
      data: {
        topPlayers: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Error retrieving top players:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve top players'
    });
  }
});

// POST /api/leaderboard/game-result - Record game result and update leaderboard
router.post('/game-result', async (req, res) => {
  try {
    const { 
      roomCode, 
      gameId, 
      playerWhiteEmail, 
      playerBlackEmail, 
      gameResult, // 'white_wins', 'black_wins', 'draw'
      totalMoves,
      gameDurationMinutes 
    } = req.body;

    // Validate input
    if (!roomCode || !gameId || !playerWhiteEmail || !playerBlackEmail || !gameResult) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: roomCode, gameId, playerWhiteEmail, playerBlackEmail, gameResult'
      });
    }

    if (!['white_wins', 'black_wins', 'draw'].includes(gameResult)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid game result. Must be: white_wins, black_wins, or draw'
      });
    }

    // Check if game result already exists
    const existingGameQuery = `
      SELECT id FROM game_results 
      WHERE room_code = $1 AND game_id = $2
    `;
    const existingGame = await query(existingGameQuery, [roomCode, gameId]);

    if (existingGame.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Game result already recorded'
      });
    }

    // Calculate points based on result
    let pointsWhite = 0;
    let pointsBlack = 0;
    let winnerEmail = null;

    switch (gameResult) {
      case 'white_wins':
        pointsWhite = 100;
        pointsBlack = 0;
        winnerEmail = playerWhiteEmail;
        break;
      case 'black_wins':
        pointsWhite = 0;
        pointsBlack = 100;
        winnerEmail = playerBlackEmail;
        break;
      case 'draw':
        pointsWhite = 50;
        pointsBlack = 50;
        winnerEmail = null;
        break;
    }

    // Start transaction
    const beginResult = await query('BEGIN');

    try {
      // Insert game result
      const insertGameResultQuery = `
        INSERT INTO game_results (
          room_code, game_id, player_white_email, player_black_email,
          winner_email, game_result, points_awarded_white, points_awarded_black,
          game_duration_minutes, total_moves
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      await query(insertGameResultQuery, [
        roomCode, gameId, playerWhiteEmail, playerBlackEmail,
        winnerEmail, gameResult, pointsWhite, pointsBlack,
        gameDurationMinutes, totalMoves
      ]);

      // Update or create leaderboard entry for white player
      await updatePlayerStats(playerWhiteEmail, pointsWhite, gameResult === 'white_wins', gameResult === 'draw');

      // Update or create leaderboard entry for black player
      await updatePlayerStats(playerBlackEmail, pointsBlack, gameResult === 'black_wins', gameResult === 'draw');

      await query('COMMIT');

      res.status(201).json({
        status: 'success',
        message: 'Game result recorded and leaderboard updated',
        data: {
          roomCode,
          gameId,
          gameResult,
          pointsAwarded: {
            white: pointsWhite,
            black: pointsBlack
          }
        }
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error recording game result:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record game result'
    });
  }
});

// Helper function to update player stats in leaderboard
async function updatePlayerStats(playerEmail, points, isWin, isDraw) {
  const playerName = playerEmail.split('@')[0]; // Extract name from email

  // Upsert player in leaderboard
  const upsertQuery = `
    INSERT INTO leaderboard (
      player_email, player_name, total_points, games_played,
      games_won, games_drawn, games_lost, current_streak, best_streak,
      last_game_date
    ) VALUES ($1, $2, $3, 1, $4, $5, $6, $7, $7, CURRENT_TIMESTAMP)
    ON CONFLICT (player_email) DO UPDATE SET
      total_points = leaderboard.total_points + $3,
      games_played = leaderboard.games_played + 1,
      games_won = leaderboard.games_won + $4,
      games_drawn = leaderboard.games_drawn + $5,
      games_lost = leaderboard.games_lost + $6,
      current_streak = CASE 
        WHEN $4 = 1 THEN leaderboard.current_streak + 1 
        ELSE 0 
      END,
      best_streak = CASE 
        WHEN $4 = 1 AND leaderboard.current_streak + 1 > leaderboard.best_streak 
        THEN leaderboard.current_streak + 1 
        ELSE leaderboard.best_streak 
      END,
      last_game_date = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `;

  const gamesWon = isWin ? 1 : 0;
  const gamesDrawn = isDraw ? 1 : 0;
  const gamesLost = (!isWin && !isDraw) ? 1 : 0;
  const newStreak = isWin ? 1 : 0;

  await query(upsertQuery, [
    playerEmail, playerName, points, gamesWon, gamesDrawn, gamesLost, newStreak
  ]);
}

export default router;