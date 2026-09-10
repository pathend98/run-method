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

## Local authentication

Keycloak provides the local OIDC identity provider at
[http://localhost:8080](http://localhost:8080). Sign in to its Admin Console with
`KEYCLOAK_ADMIN_USERNAME` and `KEYCLOAK_ADMIN_PASSWORD` from `.env.local`.

On its first container creation, Keycloak imports the `run-method` realm and
the public `run-method` client. The client uses Authorization Code flow with
PKCE (S256), allows callbacks at `http://localhost:3000/*`, and has no client
secret. Its seeded `test-user` account uses `KEYCLOAK_TEST_USER_PASSWORD` from
`.env.local`.

The Keycloak development store lives only in the container. Remove the container
with `docker compose rm -sf keycloak` to reset it and re-import the seed realm on
the next `pnpm auth:up`.

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

`DATABASE_URL` is a runtime-only server secret. Do not pass it to `docker build`
or use a `NEXT_PUBLIC_` variable. Supply it through your deployment platform, an
environment file, or `docker run -e`; the container validates it during startup.
