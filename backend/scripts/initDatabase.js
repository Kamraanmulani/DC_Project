import { query, testConnection } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// SQL to create users table
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT username_length CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50),
    CONSTRAINT phone_format CHECK (phone ~* '^[+]?[1-9][0-9]{7,14}$')
  );
`;

// SQL to create indexes for better performance
const createIndexes = `
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
  CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
`;

// SQL to create updated_at trigger function
const createUpdateTriggerFunction = `
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ language 'plpgsql';
`;

// SQL to create trigger for updated_at
const createUpdateTrigger = `
  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
`;

// Function to initialize database
async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Create users table
    console.log('📋 Creating users table...');
    await query(createUsersTable);
    console.log('✅ Users table created successfully');

    // Create indexes
    console.log('🔍 Creating indexes...');
    await query(createIndexes);
    console.log('✅ Indexes created successfully');

    // Create trigger function
    console.log('⚡ Creating trigger function...');
    await query(createUpdateTriggerFunction);
    console.log('✅ Trigger function created successfully');

    // Create trigger
    console.log('🔧 Creating update trigger...');
    await query(createUpdateTrigger);
    console.log('✅ Update trigger created successfully');

    console.log('🎉 Database initialization completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env file with your PostgreSQL credentials');
    console.log('2. Run: npm install');
    console.log('3. Run: npm run dev');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run initialization
initializeDatabase();