import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend directory
const envPath = path.join(__dirname, '..', '.env');
console.log('🔍 Loading .env from:', envPath);
const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.error('❌ Error loading .env file:', envResult.error);
} else {
  console.log('✅ .env file loaded successfully');
}

const { Client } = pkg;

// Debug: Log environment variables (remove in production)
console.log('🔍 Database Config Debug:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');

// Database configuration - use hardcoded values that work
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'ChessMate',
  user: 'postgres',
  password: 'kamm#8284',
};

console.log('🔧 Final DB Config:', {
  ...dbConfig,
  password: '***HIDDEN***'
});

// Function to test database connection
export const testConnection = async () => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log('📅 Database connection test successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  } finally {
    await client.end();
  }
};

// Function to execute queries with better error handling
export const query = async (text, params) => {
  const start = Date.now();
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('🔍 Executed query:', { text: text.substring(0, 50) + '...', duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    console.error('❌ Query text:', text);
    console.error('❌ Query params:', params);
    throw error;
  } finally {
    await client.end();
  }
};

// Function to get a client from the pool (simplified)
export const getClient = async () => {
  const client = new Client(dbConfig);
  await client.connect();
  return client;
};

export default { query, testConnection, getClient };