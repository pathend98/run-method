# Training Brain

Training Brain is a run-coaching app.

The project is currently bootstrapped as a single-package Next.js application using the App Router, TypeScript, pnpm, Node.js 24, and Docker-ready production builds.

For the broader roadmap, see [PLAN.md](PLAN.md). For architecture decisions, see [ADRs.md](ADRs.md).

## Project Structure

Training Brain is organised around deep modules: each meaningful folder should expose a small, stable interface and keep implementation details private. This follows John Ousterhout's distinction between a module's interface and its implementation.

The top-level layout is:

- `db/`: database schema and migrations. This stays outside `src/`.
- `src/app/`: Next.js App Router entrypoints. Keep this lean; route, page, layout, and API files should delegate to UI or server modules.
- `src/core/`: genuinely cross-cutting utilities that can run in either browser or server code.
- `src/domain/`: shared data models, schemas, and contracts used across browser and server code.
- `src/server/`: server-only object-oriented TypeScript. Dependency injection is rooted in `src/server/server.ts`.
- `src/ui/`: browser-side modules, including React feature modules and browser service modules.

### Module Boundaries

When a folder represents a module, its public interface is a same-name file at the module root. For example, `src/ui/training-planner/training-planner.ts` is the only public import surface for the training planner module.

Consumers outside a module must import from that public interface file, not from implementation folders. Internal implementation files should live in kind-based folders such as `components/`, `services/`, `types/`, `utils/`, and `hooks/` when needed.

Public module interfaces should stay narrow: export the main component, function, or service capability, plus only the props and types consumers need. Subcomponents, formatting helpers, utility functions, and service details should remain private unless there is a real cross-module use case.

New or reorganised modules should not use `index.ts` as the public interface. Single-file modules can remain as files until they grow enough to need a folder.

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

Apply committed migrations and verify connectivity:

```bash
pnpm db:migrate
pnpm db:check
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
pnpm db:migrate
pnpm db:check
pnpm start
```

## Docker

Build the production image:

```bash
docker build -t training-brain .
```

Run the production image:

```bash
docker run --rm -p 3000:3000 training-brain
```
