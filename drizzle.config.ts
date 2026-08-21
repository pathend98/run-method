import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";
import { createRequire } from "node:module";

loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);
const { databaseEnv } =
  require("./src/server/env/database-env") as typeof import("./src/server/env/database-env");

export default defineConfig({
  schema: "db/schema.ts",
  out: "db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseEnv.DATABASE_URL,
  },
});
