<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Training Brain

## Architectural Constraints

This is a Next.js application designed to allow runners to schedule their training plans. This is designed so that it could easily expand to a native mobile frontend in the future, and as such, there's a very particular architectural style which should be used for this application. 

Server Components should be used selectively - they can appear in the web app, but they shouldn't be used as the main data-access route for the training planner. Data fetching should be done via an HTTP API, not server-side data fetching. 

Furthermore, because `vitest` is used for unit testing, `async` server components should not be used as these can't be tested with `vitest`.

## Testing

Tests are implemented with `vitest` and `@testing-library/react`. Test files should be colocated alongside the file under test with the `.test.ts` extension. E.g. `src/file-under-test.ts` should be accompanied with `src/file-under-test.test.ts`. Each and every file should have a co-located unit test file, with a small number of exceptions - `src/server/server.ts` doesn't require a co-located test file, and the `db/` folder doesn't require tests.

Vitest globals are enabled, so you will never need to import from `vitest` in test files. 

### Testing Server Code

The server code (located in `/src/server`) is written using Object-Oriented TypeScript. Everything is defined using classes and interfaces, with dependency injection defined in `src/server/server.ts`.

