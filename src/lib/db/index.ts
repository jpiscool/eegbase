import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon and most managed Postgres providers require SSL in production.
  // rejectUnauthorized: true verifies the server cert against the system CA store
  // (works out of the box for Neon/Supabase/RDS). If you self-host with a private
  // CA, set DATABASE_CA_PEM and we'll trust that instead.
  // max:1 prevents connection exhaustion in serverless (Vercel) environments.
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: true,
          ca: process.env.DATABASE_CA_PEM || undefined,
        }
      : false,
  max: process.env.NODE_ENV === "production" ? 1 : 10,
});

export const db = drizzle(pool, { schema });
