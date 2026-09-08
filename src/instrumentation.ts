export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { readDatabaseEnv } = await import("./server/env/database-env");
  readDatabaseEnv();
}
