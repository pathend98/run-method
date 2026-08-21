# Coding Standards

These standards apply to all project code unless a framework or tool imposes a conflicting requirement.

## 1. General Principles

* Prefer simple, explicit, maintainable code over abstraction or cleverness.
* Organise code around features and domains using a screaming-architecture approach.
* Keep framework entry points lightweight.
* Prefer existing project conventions over introducing new patterns.
* Use `pnpm` for package management.
* Use `async`/`await` instead of promise chains.
* Use explicit return types for functions and methods.

## 2. TypeScript

* TypeScript must run in strict mode.
* Do not use explicit `any`.
* Avoid unsafe type assertions.
* Never use double assertions such as `value as unknown as Foo`.
* Prefer narrowing, validation, generics, or improved types over assertions.
* Use `import type` for type-only imports.
* Use `type` for normal type definitions.
* Use `interface` only when defining a contract that a class implements.
* Prefer union types over TypeScript enums where practical.
* Enums are permitted when they are the clearest representation.
* Do not duplicate identical types unnecessarily; aliases are acceptable where appropriate.

## 3. Functions and Naming

* Prefer function declarations over arrow-function assignments.

```ts
function calculateValue(params: TParams): TResponse {
  // ...
}
```

* Use `kebab-case` for files and folders where possible.
* Follow required framework or tooling filenames where they conflict with this convention.
* Use `PascalCase` for component and class names.
* Use `SCREAMING_SNAKE_CASE` for true constant values.
* Use descriptive names that reflect domain terminology.

## 4. Imports and Exports

* Prefer named exports.
* Use default exports only where Next.js requires or conventionally expects them.
* `@/` maps to `src/` and should be preferred over deep relative imports.
* `@db/` maps to `db/` and should be used for imports from the database schema or migration-adjacent database code.
* Avoid imports such as `../../../foo` when an `@/` import is clearer.
* Add a path alias when code repeatedly needs to cross a source boundary with deep relative imports.

## 5. Project Structure

The primary source layout is:

```text
src/
  core/
  app/
  domain/
  server/
    env/
  ui/
```

### `src/app`

* Contains Next.js HTTP entry points.
* Keep route files, layouts, pages, and other entry points lightweight.
* Entry points should primarily dispatch into `server` or `ui`.
* Do not place substantial business logic in this directory.

### `src/core`

* Contains small framework-independent utilities shared across application layers.
* Keep utilities focused by concern, for example `src/core/date`.
* Do not place UI, server, persistence, or domain-schema-specific code here.

### `src/domain`

* Contains schemas and definitions shared across application boundaries.
* Put shared Zod schemas here when both server and UI depend on them.
* Infer boundary types from these schemas where practical.
* Keep schemas focused on validation and type inference; unrelated parsing, formatting, grouping, or mapping logic belongs in a more specific module.

### `src/server`

* Contains backend and server-side application code.
* Organise server code by feature/domain.
* `src/server/env` is the exception and contains environment-variable loading and validation.
* Dependency wiring belongs in `src/server/server.ts`.

### `src/ui`

* Contains the application's React frontend.
* Organise UI code by feature/domain.
* Frontend API clients belong in `src/ui`, colocated with the UI domain that consumes them.
* Separate non-rendering UI logic from components. Use focused `*-service.ts` modules for grouping, mapping, date-range calculation, and similar pure functions.
* Only genuinely reusable components should live in a general `components` directory.

## 6. Next.js and React

* Client Components are the default for application UI.
* Server Components should primarily provide route-level structure and basic presentation.
* Do not fetch application data inside Server Components.
* Do not use Server Actions.
* Application data must flow through `/api/v1` endpoints.
* Use functional React components and hooks; do not use React class components.
* Split components when they begin to have multiple responsibilities.
* Prefer composition over large, highly configurable components.
* Avoid unnecessary `useEffect`.
* Prefer derived state over synchronising duplicated state with effects.
* Use `useMemo` and `useCallback` only when they solve a demonstrated problem.
* Prop spreading is acceptable when it improves composition.

## 7. State Management

* Use `useState` for ordinary component-local state.
* Prefer local state where practical.
* Avoid extreme prop drilling.
* Use Zustand for client-only application state shared across unrelated parts of the UI.
* Do not place server state in Zustand.
* Server state belongs in TanStack Query.

## 8. API and Data Fetching

* All application data fetching should use TanStack Query.
* Frontend code should access `/api/v1` through a typed API client where practical.
* Typed frontend API clients should live under `src/ui`, not in a top-level `src/api` directory.
* Avoid scattering raw `fetch` calls throughout components.
* Organise TanStack Query keys, queries, and mutations by domain.
* API routes should translate application errors into appropriate HTTP status codes and response messages.
* Successful API responses do not require a universal response envelope.
* Failed API responses should use a consistent JSON shape:

```json
{ "error": "Human-readable error message" }
```

* Frontend API clients should parse this `error` field for failed responses and provide a stable fallback when the body is missing or malformed.

## 9. Backend Architecture

* Backend application code should use object-oriented design where practical.
* Framework entry points such as API route handlers are exempt where OOP adds no value.
* Prefer the flow:

```text
route handler -> service/use case -> repository/data-access layer
```

* All classes must implement an interface.
* Classes should receive dependencies through their constructors.
* Classes should depend on interfaces rather than concrete classes where possible.
* Use manual dependency injection.
* Construct and wire server dependencies in `src/server/server.ts`.
* Do not introduce a dependency-injection framework without a compelling reason.
* Keep data-access objects separate from API/domain representations.
* Do not redefine identical types solely to create artificial layering.

## 10. Runtime Validation

* Treat external data as untrusted.
* Validate external data with Zod before using it as trusted application data.
* This includes API requests, responses where applicable, form input, environment variables, and other external boundaries.
* Infer TypeScript types from Zod schemas when data crosses a validated boundary.
* Avoid maintaining manually duplicated schema and type definitions.

## 11. Environment Variables

* Validate environment variables centrally in `src/server/env`.
* Access environment variables through the validated environment module.
* Do not scatter direct `process.env.*` access throughout the application.

## 12. Errors

* Never directly throw the generic `Error` class.

```ts
throw new Error("Something failed"); // prohibited
```

* Define and throw specifically named error classes instead.

```ts
class UserNotFoundError extends Error {
  // ...
}
```

* Use error names that communicate the failure condition.
* Place project-defined error classes in dedicated `*-errors.ts` files rather than inline with services, clients, routes, validators, or components.
* Server errors should use a small hierarchy where useful. For example, validation/request errors should extend a generic `BadRequestError` so route handlers can classify responses with `instanceof`.
* Translate application errors into HTTP responses at the API route boundary.
* Route handlers should classify generic error categories, such as `BadRequestError`, rather than importing every feature-specific validation error.
* Do not swallow errors silently.

## 13. Forms

* Use React Hook Form with Zod validation.
* Display validation and submission errors accessibly.
* Disable submission while a form submission is pending.
* Avoid duplicating validation rules already represented by a Zod schema.

## 14. Styling

* Use Tailwind CSS by default.
* Use CSS Modules when Tailwind cannot reasonably express the required styling.
* A class-name helper such as `cn()` may be used for conditional or composed classes.
* Avoid unnecessary custom CSS when Tailwind expresses the design clearly.

## 15. shadcn/ui

* Treat shadcn/ui components as owned project source code rather than immutable library components.
* Adapt shadcn/ui styling to the application's visual system.
* Avoid retaining the stock shadcn/ui appearance where project-specific styling is appropriate.
* Reuse and customise existing primitives before creating unnecessary alternatives.

## 16. Dates

* Use `date-fns` for date parsing, manipulation, comparison, and formatting.
* Do not implement date manipulation manually when `date-fns` provides the required behaviour.
* Do not introduce another date utility library without a specific need.
* Shared date parsing helpers should live in a focused date module, such as `src/core/date`, rather than inside domain schema files.
* Keep strict date parsing behavior explicit and tested, especially for `YYYY-MM-DD` strings.

## 17. Accessibility

* All user-facing UI must meet WCAG 2.2 AA.
* Prefer semantic HTML.
* Ensure interactive controls are keyboard accessible.
* Provide accessible labels and error messages.
* Use native HTML semantics before adding ARIA.
* Treat accessibility as a functional requirement, not an optional enhancement.

## 18. Testing

* Use Vitest for unit and integration tests.
* Use React Testing Library for React component tests.
* Use Vitest globals instead of importing `describe`, `it`, `expect`, and similar functions.
* Require 100% statement, branch, function, and line coverage.
* Exclude files from coverage only when there is a legitimate reason, such as boilerplate or dependency wiring.
* Colocate tests with the file under test.
* `foo.ts` should normally have `foo.test.ts`; React files should use `foo.test.tsx` where appropriate.
* Prefer multiple focused tests over a single test covering several behaviours.
* Test observable behaviour and side effects rather than implementation details.
* Do not make real network or database requests from unit tests.
* Mock external boundaries where necessary.
* When mocking a class dependency, define its contract as an interface and create a mock class implementing that same interface.
* Avoid mocks that bypass or contradict the production type contracts.
* Avoid weak assertions such as checking only array length or one partial field when the full shape is the behavior under test.
* Schema and API contract tests should assert complete expected objects, including every required field.
* Error-response tests should assert exact status codes and exact JSON error shapes.
* When adding a specific error class, test both the relevant message and the expected class where that classification matters.

## 19. Comments

* Use comments when they clarify complicated or non-obvious code.
* Prefer comments that explain reasoning or constraints.
* Do not add comments that merely restate trivial code.
* Code should remain understandable without excessive commentary.

## 20. Tooling and Dependencies

* Use ESLint and Prettier.
* Code must pass linting, formatting, type checking, and tests before being considered complete.
* New dependencies are permitted when they materially simplify or improve the implementation.
* Prefer existing platform, framework, and project capabilities when an additional dependency provides little value.

## 21. Logging

* `console.log` and other console logging are currently permitted.
* Logging should still be intentional and useful rather than leftover debugging noise.
