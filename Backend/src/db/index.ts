import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import * as schema from './schema.js';

// Ensure environment variables are available when this module loads
dotenv.config();

// Log the connection attempt (but don't log the full URL with password)
console.log('Attempting to connect to database...');
console.log('Database host: localhost:5432');
console.log('Database name: asset_management');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection
pool.on('connect', () => {
  console.log('✅ Database connection established');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
});

export const db = drizzle(pool, { schema });

// Test connection on startup
export const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection test passed:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

export default db;