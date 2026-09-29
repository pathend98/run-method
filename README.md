# Run Method

Run Method is a run-coaching app.

The project is currently bootstrapped as a single-package Next.js application using the App Router, TypeScript, pnpm, Node.js 24, and Docker-ready production builds.

## Project Structure

Run Method is organised around deep modules: each meaningful folder should expose a small, stable interface and keep implementation details private. This follows John Ousterhout's distinction between a module's interface and its implementation.

The top-level layout is:

- `db/`: database schema and migrations. This stays outside `src/`.
- `src/app/`: Next.js App Router entrypoints. Keep this lean; route, page, layout, and API files should delegate to UI or server modules.
- `src/core/`: genuinely cross-cutting utilities that can run in either browser or server code.
- `src/domain/`: shared data models, schemas, and contracts used across browser and server code.
- `src/server/`: server-only object-oriented TypeScript. Dependency injection is rooted in `src/server/server.ts`.
- `src/ui/`: browser-side modules, including React feature modules and browser service modules.
- `src/ui/components/`: a deliberately small set of reusable, feature-agnostic React components. Components belong here only after demonstrating genuine reuse across feature modules; feature-specific components stay in the owning module's private `components/` folder.

### Module Boundaries

When a folder represents a module, its public interface is the set of concrete top-level files at the module root. For example, `src/ui/training-planner/training-planner.tsx` is a public entrypoint for the training planner module.

Consumers outside a module must import from those top-level files, not from implementation folders. Internal implementation files should live in kind-based folders such as `components/`, `services/`, `types/`, `utils/`, and `hooks/` when needed.

Top-level module files should contain the concrete components, functions, or types that other modules are meant to use. They should not be re-export-only barrels. Public module interfaces should stay narrow: expose only the main capabilities and types consumers need. Subcomponents, formatting helpers, utility functions, and service details should remain private unless there is a real cross-module use case.

New or reorganised modules should not use `index.ts` as the public interface. Single-file modules can remain as files until they grow enough to need a folder.

Each `.tsx` file should define exactly one React component. Split secondary components into their own files, even when they are private to a module.

## Requirements

- Node.js 24
- pnpm 11.22.0, via Corepack or a local pnpm install

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Start PostgreSQL:

```bash
pnpm db:up
```

Start the local Keycloak OIDC server:

```bash
pnpm auth:up
```

Apply committed migrations and verify connectivity:

```bash
pnpm db:migrate
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Useful Commands

```bash
pnpm lint
pnpm test
pnpm format:check
pnpm build
pnpm db:up
pnpm auth:up
pnpm db:migrate
pnpm db:view
pnpm start
```

## Testing

Reusable domain test fixtures live in `src/test-support/fixtures/`. For example, `createUser({ firstName: "Ada" })` returns a typed `User` with the other fields supplied by the factory. Override fields relevant to the test; write intentionally malformed inputs explicitly when testing validation.

## Local authentication

Keycloak provides the local OIDC identity provider at
[http://localhost:8080](http://localhost:8080). Sign in to its Admin Console with
`KEYCLOAK_ADMIN_USERNAME` and `KEYCLOAK_ADMIN_PASSWORD` from `.env.local`.

On its first container creation, Keycloak imports the `run-method` realm and
the public `run-method` client. The client uses Authorization Code flow with
PKCE (S256), allows callbacks at `http://localhost:3000/*`, and has no client
secret. Its seeded `test-user` account uses `KEYCLOAK_TEST_USER_PASSWORD` from
`.env.local`.

The app reads `OIDC_AUTHORIZATION_ENDPOINT`, `OIDC_CALLBACK_URL`,
`OIDC_CLIENT_ID`, `OIDC_TOKEN_ENDPOINT`, `OIDC_JWKS_URL`, `OIDC_ISSUER`,
`OIDC_PROVIDER`, `OIDC_LOGOUT_ENDPOINT`, and `APP_BASE_URL`
at startup. The example environment file configures these for
the local Keycloak realm. Visiting `/auth` starts the authorization redirect;
after sign-in, `/auth/callback` exchanges the code, verifies the ID token,
creates a user if needed, and stores the access and refresh tokens in a database
session. The browser receives only a secure, HTTP-only session key cookie that
expires after 30 days. The ID token must contain an email address. Existing
Keycloak containers must be recreated or have an email added to `test-user` to
use the updated seed.

Visiting `/logout` deletes the local session, clears its cookie, and redirects
through the IdP before returning to `/`. The local settings are:

```dotenv
OIDC_PROVIDER=keycloak
OIDC_LOGOUT_ENDPOINT=http://localhost:8080/realms/run-method/protocol/openid-connect/logout
APP_BASE_URL=http://localhost:3000/
```

For an existing Keycloak realm, open the Admin Console, select `run-method`,
then Clients → `run-method` → Settings. Set **Valid post logout redirect URIs**
to `http://localhost:3000/` and save. This preserves existing realm data;
restarting the container does not update an already imported realm.

For Cognito, use your configured Cognito domain and application root:

```dotenv
OIDC_PROVIDER=cognito
OIDC_LOGOUT_ENDPOINT=https://your-domain.auth.eu-west-2.amazoncognito.com/logout
APP_BASE_URL=https://your-app.example.com/
```

Keep `OIDC_CLIENT_ID` set to the Cognito app client ID. The logout callback must
exactly match an allowed sign-out URL, including any trailing slash. Terraform
already registers `app_url` for this purpose. Supply all three logout variables
in production before deploying this version; startup validation requires them.
The callback is configured explicitly and never inferred from request headers.

If the local session is missing or deletion fails, the browser still clears its
cookie and visits the IdP. Keycloak uses `client_id` when no ID token is available
and may ask for confirmation. A database failure can leave the local session row
undeleted; logout remains best-effort in this case.

The Keycloak development store lives only in the container. Remove the container
with `docker compose rm -sf keycloak` to reset it and re-import the seed realm on
the next `pnpm auth:up`.

The seeded `test-user` has the fixed ID
`b8657d29-8f36-4dce-a9b2-615f084ac730`, which becomes the `sub` claim in issued
tokens. Fresh realm imports reuse this ID, so recreating the container keeps the
same application identity as long as the issuer URL stays unchanged.

Restarting an existing container preserves its realm, and startup import skips
realms that already exist. To adopt the fixed ID in an existing setup, reset only
the local Keycloak container (this removes its current realm data and sessions):

```bash
docker compose rm -sf keycloak
pnpm auth:up
```

Sign in again after the reset. The first login with the new fixed ID creates one
new application user; subsequent recreations reuse that identity. Existing
application users and their training data remain untouched and are not merged
into the new user.

## Docker

Build the production image:

```bash
docker build -t run-method .
```

Run the production image:

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL='postgres://run_method:run_method@host.docker.internal:5432/run_method' \
  run-method
```

Run the committed database migrations with the same image:

```bash
docker run --rm \
  -e DATABASE_URL='postgres://run_method:run_method@host.docker.internal:5432/run_method' \
  run-method node migrate.js
```

`APP_BASE_URL`, `DATABASE_URL`, and the OIDC settings are runtime-only server configuration. Do
not pass them to `docker build` or use `NEXT_PUBLIC_` variables. Supply them
through your deployment platform, an environment file, or `docker run -e`; the
container validates them during startup.

For TLS-enabled RDS, set `DATABASE_CA_PATH` to the path of the AWS RDS PEM CA
bundle. Mount that file into the container so it is readable by the `nextjs`
user; the app and `node migrate.js` verify the database certificate against it.

`APP_BASE_URL` is required and defines the application root used for redirects
and the identity provider's registered logout return URL. When upgrading an
existing deployment, set it to the previous logout callback setting's value;
there is no legacy fallback. Keep `OIDC_CALLBACK_URL` configured separately for
the login callback.
