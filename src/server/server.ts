import { DefaultApiHandler } from "./http/api-handler";
import { DefaultRequestAuthenticationService } from "./http/request-authentication-service";
import { DefaultRequestBodyReader } from "./http/request-body-reader";

import {
  CognitoLogoutProvider,
  KeycloakLogoutProvider,
  type LogoutProvider,
} from "./authentication/logout-provider";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { DefaultAuthenticationService } from "./authentication/authentication-service";
import { readAppEnv } from "./env/app-env";
import { readAuthenticationEnv } from "./env/authentication-env";
import { readDatabaseEnv } from "./env/database-env";
import { readDatabaseTlsOptions } from "./env/database-tls";
import { DefaultJwtService } from "./jwt/jwt-service";
import { DrizzleTrainingSessionsRepository } from "./training-sessions/training-sessions-repository";
import { DefaultTrainingSessionsService } from "./training-sessions/training-sessions-service";
import { DefaultTrainingSessionsTransformer } from "./training-sessions/training-sessions-transformer";
import { DefaultTrainingSessionsValidator } from "./training-sessions/training-sessions-validator";
import { DrizzleUserRepository } from "./user/user-repository";
import { DefaultUserProfileRequestValidator } from "./user/user-profile-request-validator";
import { DefaultUserService } from "./user/user-service";

export const apiHandler = new DefaultApiHandler();
export const requestBodyReader = new DefaultRequestBodyReader();
export const requestAuthenticationService =
  new DefaultRequestAuthenticationService(getUserService);

export const userProfileRequestValidator =
  new DefaultUserProfileRequestValidator();

let trainingSessionsService: DefaultTrainingSessionsService | undefined;
let authenticationService: DefaultAuthenticationService | undefined;
let userService: DefaultUserService | undefined;
let database: NodePgDatabase | undefined;

export function getAuthenticationService(): DefaultAuthenticationService {
  if (authenticationService) {
    return authenticationService;
  }

  const authenticationEnv = readAuthenticationEnv();
  authenticationService = new DefaultAuthenticationService(
    {
      authorizationEndpoint: authenticationEnv.OIDC_AUTHORIZATION_ENDPOINT,
      callbackUrl: authenticationEnv.OIDC_CALLBACK_URL,
      clientId: authenticationEnv.OIDC_CLIENT_ID,
      tokenEndpoint: authenticationEnv.OIDC_TOKEN_ENDPOINT,
    },
    new DefaultJwtService({
      jwksUrl: authenticationEnv.OIDC_JWKS_URL,
      issuer: authenticationEnv.OIDC_ISSUER,
      audience: authenticationEnv.OIDC_CLIENT_ID,
    }),
  );

  return authenticationService;
}

export function getTrainingSessionsService(): DefaultTrainingSessionsService {
  if (trainingSessionsService) {
    return trainingSessionsService;
  }

  const trainingSessionsTransformer = new DefaultTrainingSessionsTransformer();
  const trainingSessionsRepository = new DrizzleTrainingSessionsRepository(
    getDatabase(),
    trainingSessionsTransformer,
  );
  const trainingSessionsValidator = new DefaultTrainingSessionsValidator();

  trainingSessionsService = new DefaultTrainingSessionsService(
    trainingSessionsRepository,
    trainingSessionsValidator,
    getUserService(),
  );

  return trainingSessionsService;
}

export function getUserService(): DefaultUserService {
  if (userService) return userService;

  userService = new DefaultUserService(
    new DrizzleUserRepository(getDatabase()),
  );
  return userService;
}

function getDatabase(): NodePgDatabase {
  if (database) return database;

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
  database = drizzle(pool);
  return database;
}

export function getLogoutUrlStrategy(): LogoutProvider {
  const env = readAuthenticationEnv();
  const configuration = {
    endpoint: env.OIDC_LOGOUT_ENDPOINT,
    callbackUrl: readAppEnv().APP_BASE_URL,
    clientId: env.OIDC_CLIENT_ID,
  };
  return env.OIDC_PROVIDER === "keycloak"
    ? new KeycloakLogoutProvider(configuration)
    : new CognitoLogoutProvider(configuration);
}
