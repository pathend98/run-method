import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { databaseEnv } from "./env/database-env";
import { DrizzleTrainingSessionsRepository } from "./training-sessions/training-sessions-repository";
import { DefaultTrainingSessionsService } from "./training-sessions/training-sessions-service";

const pool = new Pool({
  connectionString: databaseEnv.DATABASE_URL,
  max: databaseEnv.MAX_CONNECTIONS,
  idleTimeoutMillis: databaseEnv.DATABASE_IDLE_CONNECTION_TIMEOUT_MS,
  connectionTimeoutMillis: databaseEnv.DATABASE_CONNECTION_TIMEOUT_MS,
});

export const db = drizzle(pool);
const trainingSessionsRepository = new DrizzleTrainingSessionsRepository(db);

export const trainingSessionsService = new DefaultTrainingSessionsService(
  trainingSessionsRepository,
);
