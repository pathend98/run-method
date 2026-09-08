import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";
import { createRequire } from "node:module";
import type * as databaseEnvModule from "./src/server/env/database-env";

loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);
const { readDatabaseEnv } =
  require("./src/server/env/database-env") as typeof databaseEnvModule;
const databaseEnv = readDatabaseEnv();

export default defineConfig({
  schema: "db/schema.ts",
  out: "db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseEnv.DATABASE_URL,
  },
});
