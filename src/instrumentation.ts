export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const [{ readAppEnv }, { readAuthenticationEnv }, { readDatabaseEnv }] =
    await Promise.all([
      import("./server/env/app-env"),
      import("./server/env/authentication-env"),
      import("./server/env/database-env"),
    ]);
  readAppEnv();
  readAuthenticationEnv();
  readDatabaseEnv();
}
