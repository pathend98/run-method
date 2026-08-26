import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { databaseEnv } from "./env/database-env";
import { DrizzleTrainingSessionsRepository } from "./training-sessions/training-sessions-repository";
import { DefaultTrainingSessionsRequestValidator } from "./training-sessions/training-sessions-request-validator";
import { DefaultTrainingSessionsService } from "./training-sessions/training-sessions-service";
import { DefaultTrainingSessionsTransformer } from "./training-sessions/training-sessions-transformer";

const pool = new Pool({
  connectionString: databaseEnv.DATABASE_URL,
  max: databaseEnv.MAX_CONNECTIONS,
  idleTimeoutMillis: databaseEnv.DATABASE_IDLE_CONNECTION_TIMEOUT_MS,
  connectionTimeoutMillis: databaseEnv.DATABASE_CONNECTION_TIMEOUT_MS,
});

export const db = drizzle(pool);
const trainingSessionsTransformer = new DefaultTrainingSessionsTransformer();
const trainingSessionsRepository = new DrizzleTrainingSessionsRepository(
  db,
  trainingSessionsTransformer,
);

export const trainingSessionsService = new DefaultTrainingSessionsService(
  trainingSessionsRepository,
);
export const trainingSessionsRequestValidator =
  new DefaultTrainingSessionsRequestValidator();
