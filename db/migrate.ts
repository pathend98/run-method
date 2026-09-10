import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

const SSL_CONNECTION_PARAMETERS = [
  "ssl",
  "sslmode",
  "sslrootcert",
  "sslcert",
  "sslkey",
];

async function runMigrations(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run database migrations");
  }

  const databaseCaPath = process.env.DATABASE_CA_PATH;
  let poolConnectionString = connectionString;

  if (databaseCaPath) {
    const connectionUrl = new URL(connectionString);

    for (const parameter of SSL_CONNECTION_PARAMETERS) {
      connectionUrl.searchParams.delete(parameter);
    }

    poolConnectionString = connectionUrl.toString();
  }

  const pool = new Pool({
    connectionString: poolConnectionString,
    ...(databaseCaPath
      ? {
          ssl: {
            ca: readFileSync(databaseCaPath, "utf8"),
            rejectUnauthorized: true,
          },
        }
      : {}),
  });

  try {
    await migrate(drizzle(pool), { migrationsFolder: "db/migrations" });
  } finally {
    await pool.end();
  }
}

void runMigrations().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
