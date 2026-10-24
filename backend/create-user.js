import pkg from 'pg';
const { Client } = pkg;

async function createDatabaseUser() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Connect to default postgres database
    user: 'postgres',
    password: 'kamm#8284'
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL as postgres user');
    
    // Create a new user for the application
    try {
      await client.query(`CREATE USER chessmate_user WITH PASSWORD 'kamm#8284';`);
      console.log('✅ Created chessmate_user');
    } catch (err) {
      if (err.code === '42710') { // User already exists
        console.log('⚠️  User chessmate_user already exists');
      } else {
        throw err;
      }
    }
    
    // Grant privileges
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE "ChessMate" TO chessmate_user;`);
    console.log('✅ Granted privileges on ChessMate database');
    
    await client.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chessmate_user;`);
    console.log('✅ Granted table privileges');
    
    await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chessmate_user;`);
    console.log('✅ Granted sequence privileges');
    
    console.log('\n🎉 Database user setup complete!');
    console.log('You can now update your .env file to use:');
    console.log('DB_USER=chessmate_user');
    console.log('DB_PASSWORD=kamm#8284');
    
  } catch (error) {
    console.error('❌ Error creating database user:', error.message);
  } finally {
    await client.end();
  }
}

createDatabaseUser();