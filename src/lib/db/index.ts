import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon and most managed Postgres providers require SSL in production.
  // max:1 prevents connection exhaustion in serverless (Vercel) environments.
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: process.env.NODE_ENV === "production" ? 1 : 10,
});

export const db = drizzle(pool, { schema });
