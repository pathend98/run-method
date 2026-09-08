import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { readDatabaseEnv } from "./env/database-env";
import { DrizzleTrainingSessionsRepository } from "./training-sessions/training-sessions-repository";
import { DefaultTrainingSessionsRequestValidator } from "./training-sessions/training-sessions-request-validator";
import { DefaultTrainingSessionsService } from "./training-sessions/training-sessions-service";
import { DefaultTrainingSessionsTransformer } from "./training-sessions/training-sessions-transformer";
import { DefaultTrainingSessionsValidator } from "./training-sessions/training-sessions-validator";

export const trainingSessionsRequestValidator =
  new DefaultTrainingSessionsRequestValidator();

let trainingSessionsService: DefaultTrainingSessionsService | undefined;

export function getTrainingSessionsService(): DefaultTrainingSessionsService {
  if (trainingSessionsService) {
    return trainingSessionsService;
  }

  const databaseEnv = readDatabaseEnv();
  const pool = new Pool({
    connectionString: databaseEnv.DATABASE_URL,
    max: databaseEnv.MAX_CONNECTIONS,
    idleTimeoutMillis: databaseEnv.DATABASE_IDLE_CONNECTION_TIMEOUT_MS,
    connectionTimeoutMillis: databaseEnv.DATABASE_CONNECTION_TIMEOUT_MS,
  });
  const db = drizzle(pool);
  const trainingSessionsTransformer = new DefaultTrainingSessionsTransformer();
  const trainingSessionsRepository = new DrizzleTrainingSessionsRepository(
    db,
    trainingSessionsTransformer,
  );
  const trainingSessionsValidator = new DefaultTrainingSessionsValidator();

  trainingSessionsService = new DefaultTrainingSessionsService(
    trainingSessionsRepository,
    trainingSessionsValidator,
  );

  return trainingSessionsService;
}
