import pkg from 'pg';
const { Client } = pkg;

async function directTest() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'ChessMate',
    user: 'postgres',
    password: 'kamm#8284'
  });

  try {
    console.log('🔄 Attempting direct connection...');
    await client.connect();
    console.log('✅ Direct connection successful!');
    
    // Create users table
    const createTableSQL = `
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
        CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
        CONSTRAINT username_length CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50),
        CONSTRAINT phone_format CHECK (phone ~* '^[+]?[1-9][0-9]{7,14}$')
      );
    `;
    
    await client.query(createTableSQL);
    console.log('✅ Users table created successfully!');
    
    // Create indexes
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    `;
    
    await client.query(indexSQL);
    console.log('✅ Indexes created successfully!');
    
    await client.end();
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end().catch(() => {});
  }
}

directTest();