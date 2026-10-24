import { leaderboardService } from '../services/gameService.js';

// Test function to add sample leaderboard data
export const addSampleData = async () => {
  console.log('Adding sample leaderboard data...');
  
  const sampleGames = [
    {
      roomCode: '123',
      gameId: 'game_1',
      playerWhiteEmail: 'alice@example.com',
      playerBlackEmail: 'bob@example.com',
      gameResult: 'white_wins',
      totalMoves: 42,
      gameDurationMinutes: 15
    },
    {
      roomCode: '124',
      gameId: 'game_2',
      playerWhiteEmail: 'charlie@example.com',
      playerBlackEmail: 'alice@example.com',
      gameResult: 'black_wins',
      totalMoves: 38,
      gameDurationMinutes: 20
    },
    {
      roomCode: '125',
      gameId: 'game_3',
      playerWhiteEmail: 'bob@example.com',
      playerBlackEmail: 'charlie@example.com',
      gameResult: 'draw',
      totalMoves: 55,
      gameDurationMinutes: 25
    },
    {
      roomCode: '126',
      gameId: 'game_4',
      playerWhiteEmail: 'alice@example.com',
      playerBlackEmail: 'david@example.com',
      gameResult: 'white_wins',
      totalMoves: 33,
      gameDurationMinutes: 12
    },
    {
      roomCode: '127',
      gameId: 'game_5',
      playerWhiteEmail: 'david@example.com',
      playerBlackEmail: 'bob@example.com',
      gameResult: 'black_wins',
      totalMoves: 47,
      gameDurationMinutes: 18
    }
  ];

  try {
    for (const game of sampleGames) {
      const result = await leaderboardService.recordGameResult(game);
      if (result.success) {
        console.log(`✅ Game ${game.gameId} recorded successfully`);
      } else {
        console.error(`❌ Failed to record game ${game.gameId}:`, result.error);
      }
    }
    console.log('Sample data addition completed!');
  } catch (error) {
    console.error('Error adding sample data:', error);
  }
};

// Run this if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addSampleData();
}