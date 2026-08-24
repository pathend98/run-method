<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Training Brain

## Architectural Constraints

This is a Next.js application for runners to schedule their training plans. It should be able to expand to a native mobile frontend in the future, so browser, server, and shared domain concerns must remain cleanly separated.

Server Components should be used selectively. They can appear in the web app, but they should not be the main data-access route for the training planner. Data fetching should happen through an HTTP API, not server-side data fetching.

Because `vitest` is used for unit testing, do not add `async` Server Components. They cannot be tested with the current Vitest setup.

## Project Structure

The repo is organised around deep modules in the John Ousterhout sense: each meaningful module should expose a small interface and hide a larger implementation behind it.

- `db/` contains database schema and migrations. Keep it outside `src/`.
- `src/app/` contains Next.js App Router entrypoints. Keep it lean: pages, layouts, route handlers, providers, and minimal wiring only.
- `src/core/` contains genuinely cross-cutting utilities that can run in browser or server code.
- `src/domain/` contains shared data models, schemas, and contracts used by both browser and server code.
- `src/server/` contains server-only object-oriented TypeScript. Dependency injection belongs in `src/server/server.ts`.
- `src/ui/` contains browser-side modules, including React feature modules and browser service modules.

## Module Boundaries

When a folder represents a module, its public interface is the set of concrete top-level files at that module's root. For example, `src/ui/training-planner/training-planner.tsx` is a public entrypoint for `src/ui/training-planner/`.

Code outside a module must import from that module's top-level files. Do not import from another module's private `components/`, `services/`, `types/`, `utils/`, or `hooks/` folders.

Do not use `index.ts` as the public interface for new or reorganised modules. Use concrete top-level files named after the capability they expose.

Inside a module, organise implementation files by kind:

- `components/` for React components.
- `services/` for data fetching, orchestration, and browser/server service code.
- `types/` for module-specific types.
- `utils/` for private helper functions and constants.
- `hooks/` for React hooks when needed.

Public top-level module files should contain the concrete components, functions, or types that other modules are meant to use. They should not be re-export-only barrels.

Keep public interfaces narrow. Expose the main component, function, or service capability, plus public props and types needed by consumers. Keep subcomponents, formatting helpers, utility functions, and service details private unless there is a concrete cross-module use case.

Each `.tsx` file should define exactly one React component. Split secondary components into their own files, even when they are private to a module.

Single-file modules may remain as files until they grow enough to need a folder. Next.js route folders and framework-shaped files under `src/app/` are exempt where the framework requires a different shape.

## Testing

Tests are implemented with `vitest` and `@testing-library/react`. Test files should be colocated alongside the file under test. Use `.test.ts` for TypeScript files and `.test.tsx` for React component files.

Each file should have a colocated unit test file, with a small number of exceptions: `src/server/server.ts` does not require a colocated test file, and the `db/` folder does not require tests. Any files containing just types do not require tests either.

Vitest globals are enabled, so do not import from `vitest` in test files.

Implementation tests may import the internal file they test directly. Cross-module or integration-style tests should import through the module's public interface.

### Testing Server Code

Server code in `src/server` is written using object-oriented TypeScript. Everything should be defined using classes and interfaces, with dependency injection defined in `src/server/server.ts`.
