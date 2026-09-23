import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { DefaultAuthenticationService } from "./authentication/authentication-service";
import { readAuthenticationEnv } from "./env/authentication-env";
import { readDatabaseEnv } from "./env/database-env";
import { readDatabaseTlsOptions } from "./env/database-tls";
import { DrizzleTrainingSessionsRepository } from "./training-sessions/training-sessions-repository";
import { DefaultTrainingSessionsRequestValidator } from "./training-sessions/training-sessions-request-validator";
import { DefaultTrainingSessionsService } from "./training-sessions/training-sessions-service";
import { DefaultTrainingSessionsTransformer } from "./training-sessions/training-sessions-transformer";
import { DefaultTrainingSessionsValidator } from "./training-sessions/training-sessions-validator";

export const trainingSessionsRequestValidator =
  new DefaultTrainingSessionsRequestValidator();

let trainingSessionsService: DefaultTrainingSessionsService | undefined;
let authenticationService: DefaultAuthenticationService | undefined;

export function getAuthenticationService(): DefaultAuthenticationService {
  if (authenticationService) {
    return authenticationService;
  }

  const authenticationEnv = readAuthenticationEnv();
  authenticationService = new DefaultAuthenticationService({
    authorizationEndpoint: authenticationEnv.OIDC_AUTHORIZATION_ENDPOINT,
    callbackUrl: authenticationEnv.OIDC_CALLBACK_URL,
    clientId: authenticationEnv.OIDC_CLIENT_ID,
  });

  return authenticationService;
}

export function getTrainingSessionsService(): DefaultTrainingSessionsService {
  if (trainingSessionsService) {
    return trainingSessionsService;
  }

  const databaseEnv = readDatabaseEnv();
  const databaseTlsOptions = readDatabaseTlsOptions(
    databaseEnv.DATABASE_URL,
    databaseEnv.DATABASE_CA_PATH,
  );
  const pool = new Pool({
    ...databaseTlsOptions,
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
