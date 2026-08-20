import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

import { databaseEnv } from "@/server/env/database-env";

loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "db/schema.ts",
  out: "db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseEnv.DATABASE_URL,
  },
});
