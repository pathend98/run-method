import { cleanEnv, num } from "envalid";
import { postgresUrlValidator } from "./validators/postgres-url-validator";

type DatabaseEnv = {
  DATABASE_URL: string;
  MAX_CONNECTIONS: number;
  DATABASE_IDLE_CONNECTION_TIMEOUT_MS: number;
  DATABASE_CONNECTION_TIMEOUT_MS: number;
};

export function readDatabaseEnv(): DatabaseEnv {
  const env = cleanEnv(process.env, {
    DATABASE_URL: postgresUrlValidator({
      desc: "PostgreSQL connection string",
      example:
        "postgres://training_brain:training_brain@localhost:5432/training_brain",
    }),
    MAX_DATABASE_CONNECTIONS: num({
      desc: "Maximum number of database connections which can be open at once",
      example: "5",
      default: 5,
    }),
    DATABASE_IDLE_CONNECTION_TIMEOUT_MS: num({
      desc: "Maximum number of milliseconds a database connection can be idle before being closed",
      example: "30000",
      default: 30_000,
    }),
    DATABASE_CONNECTION_TIMEOUT_MS: num({
      desc: "Maximum number of milliseconds to wait for a database connection to be established before timing out",
      example: "5000",
      default: 5_000,
    }),
  });

  return {
    DATABASE_URL: env.DATABASE_URL,
    MAX_CONNECTIONS: env.MAX_DATABASE_CONNECTIONS,
    DATABASE_IDLE_CONNECTION_TIMEOUT_MS:
      env.DATABASE_IDLE_CONNECTION_TIMEOUT_MS,
    DATABASE_CONNECTION_TIMEOUT_MS: env.DATABASE_CONNECTION_TIMEOUT_MS,
  };
}
