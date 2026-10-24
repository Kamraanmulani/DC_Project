import { query, testConnection } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// SQL to create leaderboard table
const createLeaderboardTable = `
  CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    player_email VARCHAR(255) NOT NULL,
    player_name VARCHAR(100),
    total_points INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_drawn INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_game_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_player_email UNIQUE(player_email),
    CONSTRAINT email_format CHECK (player_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT positive_points CHECK (total_points >= 0),
    CONSTRAINT valid_games CHECK (games_played >= 0 AND games_won >= 0 AND games_drawn >= 0 AND games_lost >= 0),
    CONSTRAINT games_consistency CHECK (games_played = games_won + games_drawn + games_lost)
  );
`;

// SQL to create game_results table for tracking individual game outcomes
const createGameResultsTable = `
  CREATE TABLE IF NOT EXISTS game_results (
    id SERIAL PRIMARY KEY,
    room_code VARCHAR(10) NOT NULL,
    game_id VARCHAR(100) NOT NULL,
    player_white_email VARCHAR(255) NOT NULL,
    player_black_email VARCHAR(255) NOT NULL,
    winner_email VARCHAR(255), -- NULL for draw
    game_result VARCHAR(20) NOT NULL, -- 'white_wins', 'black_wins', 'draw'
    points_awarded_white INTEGER NOT NULL DEFAULT 0,
    points_awarded_black INTEGER NOT NULL DEFAULT 0,
    game_duration_minutes INTEGER,
    total_moves INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_result CHECK (game_result IN ('white_wins', 'black_wins', 'draw')),
    CONSTRAINT valid_points CHECK (points_awarded_white >= 0 AND points_awarded_black >= 0),
    CONSTRAINT winner_consistency CHECK (
      (game_result = 'white_wins' AND winner_email = player_white_email) OR
      (game_result = 'black_wins' AND winner_email = player_black_email) OR
      (game_result = 'draw' AND winner_email IS NULL)
    )
  );
`;

// SQL to create updated_at trigger function (if it doesn't exist)
const createUpdateTriggerFunction = `
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ language 'plpgsql';
`;

// SQL to create indexes for better performance
const createLeaderboardIndexes = `
  CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(total_points DESC);
  CREATE INDEX IF NOT EXISTS idx_leaderboard_email ON leaderboard(player_email);
  CREATE INDEX IF NOT EXISTS idx_leaderboard_games_played ON leaderboard(games_played DESC);
  CREATE INDEX IF NOT EXISTS idx_leaderboard_updated_at ON leaderboard(updated_at DESC);
  
  CREATE INDEX IF NOT EXISTS idx_game_results_room_code ON game_results(room_code);
  CREATE INDEX IF NOT EXISTS idx_game_results_game_id ON game_results(game_id);
  CREATE INDEX IF NOT EXISTS idx_game_results_completed_at ON game_results(completed_at DESC);
  CREATE INDEX IF NOT EXISTS idx_game_results_players ON game_results(player_white_email, player_black_email);
`;

// SQL to create updated_at trigger for leaderboard
const createLeaderboardUpdateTrigger = `
  DROP TRIGGER IF EXISTS update_leaderboard_updated_at ON leaderboard;
  CREATE TRIGGER update_leaderboard_updated_at 
    BEFORE UPDATE ON leaderboard 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
`;

// Function to initialize leaderboard tables
async function createLeaderboardTables() {
  try {
    console.log('🚀 Starting leaderboard tables creation...');
    
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Create leaderboard table
    console.log('📋 Creating leaderboard table...');
    await query(createLeaderboardTable);
    console.log('✅ Leaderboard table created successfully');

    // Create game_results table
    console.log('📋 Creating game_results table...');
    await query(createGameResultsTable);
    console.log('✅ Game results table created successfully');

    // Create indexes
    console.log('🔍 Creating leaderboard indexes...');
    await query(createLeaderboardIndexes);
    console.log('✅ Leaderboard indexes created successfully');

    // Create trigger function
    console.log('⚡ Creating trigger function...');
    await query(createUpdateTriggerFunction);
    console.log('✅ Trigger function created successfully');

    // Create trigger for leaderboard updated_at
    console.log('🔧 Creating leaderboard update trigger...');
    await query(createLeaderboardUpdateTrigger);
    console.log('✅ Leaderboard update trigger created successfully');

    console.log('🎉 Leaderboard tables creation completed successfully!');
    console.log('\n📝 Tables created:');
    console.log('- leaderboard: Stores player rankings and statistics');
    console.log('- game_results: Stores individual game outcomes and points awarded');
    
  } catch (error) {
    console.error('❌ Leaderboard tables creation failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run creation
createLeaderboardTables();