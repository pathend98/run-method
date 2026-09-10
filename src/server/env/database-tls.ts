import { readFileSync } from "node:fs";
import type { PoolConfig } from "pg";

const SSL_CONNECTION_PARAMETERS = [
  "ssl",
  "sslmode",
  "sslrootcert",
  "sslcert",
  "sslkey",
];

export function readDatabaseTlsOptions(
  connectionString: string,
  databaseCaPath: string | undefined,
): Pick<PoolConfig, "connectionString" | "ssl"> {
  if (!databaseCaPath) {
    return { connectionString };
  }

  const connectionUrl = new URL(connectionString);

  for (const parameter of SSL_CONNECTION_PARAMETERS) {
    connectionUrl.searchParams.delete(parameter);
  }

  return {
    connectionString: connectionUrl.toString(),
    ssl: {
      ca: readFileSync(databaseCaPath, "utf8"),
      rejectUnauthorized: true,
    },
  };
}
