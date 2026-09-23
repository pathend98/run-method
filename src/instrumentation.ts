export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const [{ readAuthenticationEnv }, { readDatabaseEnv }] = await Promise.all([
    import("./server/env/authentication-env"),
    import("./server/env/database-env"),
  ]);
  readAuthenticationEnv();
  readDatabaseEnv();
}
