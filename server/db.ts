import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Validate that DATABASE_URL environment variable is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create a drizzle client instance
export const db = drizzle(pool, { schema });

// Test function to check database connectivity
export async function testDatabaseConnection() {
  try {
    // Simple query to check connection
    const result = await pool.query('SELECT version();');
    return { 
      connected: true,
      version: result.rows[0].version 
    };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return { 
      connected: false,
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}