import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { databaseEnv } from "./env/database-env";

const pool = new Pool({
  connectionString: databaseEnv.DATABASE_URL,
  max: databaseEnv.MAX_CONNECTIONS,
  idleTimeoutMillis: databaseEnv.DATABASE_IDLE_CONNECTION_TIMEOUT_MS,
  connectionTimeoutMillis: databaseEnv.DATABASE_CONNECTION_TIMEOUT_MS,
});

const db = drizzle(pool);
