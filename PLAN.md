# V1 Sequential Development Plan

The tasks below are ordered so that each stage leaves the codebase in a usable state and minimizes the amount of frontend work built on an unstable domain or API.

## 1. Bootstrap the repository

* [x] Create the single-package Next.js application using Node.js 24, pnpm, TypeScript, and the App Router.
* [x] Enable strict TypeScript.
* [x] Configure ESLint and Prettier.
* [x] Remove the initial boilerplate code from the Next.js application which isn't required for this app.
* [x] Establish the initial `src/app`, `domain`, `application`, `schemas`, `api-client`, `db`, and `components` boundaries.
* [x] Add the basic production Dockerfile.

**Exit condition:** an empty application can be built locally as a Docker image.

## 2. Establish PostgreSQL infrastructure

* [x] Add `pg`, Drizzle ORM, and Drizzle Kit.
* [x] Configure the bounded PostgreSQL connection pool.
* [x] Configure Drizzle migration generation and execution.
* [x] Define how `DATABASE_URL` is supplied locally, in tests, and in deployment.
* [x] Add a local PostgreSQL development workflow.
* [x] Establish the rule that migrations are committed SQL artifacts and are not automatically applied by application startup.

**Exit condition:** the application can connect to PostgreSQL and a migration can be generated and applied successfully.

## 3. Implement the initial relational schema

* [ ] Create `training_sessions`.
* [ ] Create `run_details`.
* [ ] Create `strength_details`.
* [ ] Add UUID primary keys.
* [ ] Add foreign keys and `ON DELETE CASCADE`.
* [ ] Add `created_at` and `updated_at`.
* [ ] Add text-based domain fields and `CHECK` constraints.
* [ ] Add the required `skip_reason` status constraint.
* [ ] Add run target-type shape constraints.
* [ ] Add positive-value constraints for numeric metrics.
* [ ] Add the weekly-query composite index.
* [ ] Generate and review the initial Drizzle migration.

**Exit condition:** PostgreSQL can represent every V1 session state and rejects locally invalid records.

## 4. Build the domain model and calculations

* [ ] Define activity-type, status, time-of-day, and run-target discriminated unions.
* [ ] Implement run target calculations:

  * [ ] distance + duration → pace;
  * [ ] distance + pace → duration range;
  * [ ] duration + pace → distance range.
* [ ] Implement whole-second and whole-metre rounding.
* [ ] Implement actual-pace derivation.
* [ ] Implement canonical session ordering.
* [ ] Implement valid lifecycle transitions.
* [ ] Implement editability rules for scheduled vs terminal states.
* [ ] Implement target/date/time movement behavior and destination ordering.
* [ ] Add comprehensive unit tests for the domain layer.

**Exit condition:** the core business rules operate independently of HTTP, React, and PostgreSQL.

## 5. Define shared Zod contracts

* [ ] Define `TrainingSession` as an activity-type discriminated union.
* [ ] Define `RunTargets` as a target-type discriminated union.
* [ ] Define `DerivedRunTarget` as a discriminated union.
* [ ] Define create-session requests.
* [ ] Define ordinary update requests.
* [ ] Define complete-session commands.
* [ ] Define skip-session commands.
* [ ] Define reset commands.
* [ ] Define completion-correction and skip-correction requests.
* [ ] Define weekly query parameters.
* [ ] Define the standardized API error contract.
* [ ] Add tests for successful and rejected schema cases.

**Exit condition:** every public API payload has a single runtime-validatable definition.

## 6. Implement the persistence/repository layer

* [ ] Implement weekly date-range retrieval.
* [ ] Implement canonical SQL result ordering.
* [ ] Implement creation in a transaction.
* [ ] Implement backend assignment of `sort_order`.
* [ ] Implement ordinary update transactions.
* [ ] Implement date/time-bucket move behavior.
* [ ] Implement completion.
* [ ] Implement skipping.
* [ ] Implement reset.
* [ ] Implement completion correction.
* [ ] Implement skip-reason correction.
* [ ] Implement hard deletion.
* [ ] Ensure every aggregate update explicitly modifies `updated_at`.

**Exit condition:** all training-session use cases can be executed directly against PostgreSQL without an HTTP layer.

## 7. Establish PostgreSQL-backed integration testing

* [ ] Add Testcontainers.
* [ ] Start an ephemeral PostgreSQL instance for integration suites.
* [ ] Apply the real Drizzle migrations before tests.
* [ ] Establish deterministic test-data cleanup/reset.
* [ ] Test database constraints.
* [ ] Test transactional create/update/delete behavior.
* [ ] Test lifecycle transitions.
* [ ] Test ordering and date-range retrieval.
* [ ] Add these tests to CI.

**Exit condition:** the repository and migrations are continuously tested against real PostgreSQL.

## 8. Implement the application/use-case layer

* [ ] Add orchestration between Zod/domain validation and repositories.
* [ ] Ensure generic updates cannot modify lifecycle-only fields.
* [ ] Enforce cross-table status/actuals rules.
* [ ] Enforce terminal-state edit restrictions.
* [ ] Produce full API/domain session representations.
* [ ] Calculate derived targets before responses are returned.
* [ ] Normalize application errors into stable error categories.

**Exit condition:** route handlers can delegate complete business operations to application services without containing business rules themselves.

## 9. Implement `/api/v1`

* [ ] Implement inclusive date-range `GET`.
* [ ] Enforce the 31-day maximum.
* [ ] Implement create.
* [ ] Implement ordinary update.
* [ ] Implement hard delete.
* [ ] Implement complete.
* [ ] Implement skip.
* [ ] Implement reset.
* [ ] Implement completion correction.
* [ ] Implement skip correction.
* [ ] Return complete session representations after successful writes.
* [ ] Return `204` after delete.
* [ ] Implement standardized validation/not-found/conflict/internal errors.
* [ ] Add correlation IDs and structured error logging.

**Exit condition:** all required CRUD and lifecycle behavior is available through a stable HTTP API.

## 10. Test the HTTP API end to end at the service/database level

* [ ] Exercise every API endpoint against Testcontainers PostgreSQL.
* [ ] Test valid run-target combinations.
* [ ] Test invalid target combinations.
* [ ] Test lifecycle-state rejection.
* [ ] Test terminal-state editing restrictions.
* [ ] Test reset data cleanup.
* [ ] Test skip-reason requirements.
* [ ] Test moving sessions between buckets.
* [ ] Test the 31-day range restriction.
* [ ] Test complete response parsing using shared Zod schemas.

**Exit condition:** the entire HTTP → application → Drizzle → PostgreSQL path is covered without mocks.

## 11. Generate OpenAPI documentation

* [ ] Add Zod-to-OpenAPI generation.
* [ ] Describe all V1 endpoints and payloads.
* [ ] Expose `/api/v1/openapi.json`.
* [ ] Add Swagger-style documentation in development only.
* [ ] Add a CI consistency check where practical so API changes cannot silently diverge from the published contract.

**Exit condition:** the HTTP API can be understood independently of the frontend source code.

## 12. Implement the typed API client

* [ ] Add typed functions for weekly retrieval and every mutation/command.
* [ ] Parse successful responses through Zod.
* [ ] Parse standardized errors through Zod.
* [ ] Normalize network/API failure behavior.
* [ ] Keep raw `fetch` out of React components.

**Exit condition:** frontend code consumes typed functions rather than manually constructing HTTP requests.

## 13. Establish frontend foundations

* [ ] Add Tailwind.
* [ ] Configure CSS Modules.
* [ ] Add customized shadcn/ui primitives required for the first screens.
* [ ] Add TanStack Query provider/configuration.
* [ ] Add React Hook Form and Zod resolver integration.
* [ ] Add date-fns.
* [ ] Establish the initial design tokens and minimal/editorial visual direction.
* [ ] Implement reusable loading/error/empty-state primitives.

**Exit condition:** the frontend foundation is ready without yet implementing the planner itself.

## 14. Implement week routing and navigation

* [ ] Implement `/training`.
* [ ] Read `week=YYYY-MM-DD`.
* [ ] Determine the browser-local current week.
* [ ] Normalize non-Mondays to Monday.
* [ ] Correct malformed/missing URLs.
* [ ] Implement previous-week navigation.
* [ ] Implement next-week navigation.
* [ ] Implement Today navigation.
* [ ] Derive inclusive API `from`/`to` dates.
* [ ] Highlight today's date.

**Exit condition:** week navigation behaves correctly before session UI is added.

## 15. Implement weekly data loading

* [ ] Add the TanStack Query weekly-session query.
* [ ] Implement initial loading state.
* [ ] Implement empty-week state.
* [ ] Implement inline planner error state.
* [ ] Implement manual Retry.
* [ ] Do not enable silent write retry behavior.

**Exit condition:** `/training` can reliably load and recover from weekly API failures.

## 16. Build the responsive planner layout

* [ ] Implement Monday–Sunday desktop/tablet columns.
* [ ] Implement vertically stacked mobile days.
* [ ] Add AM, Any time, and PM sections to every day.
* [ ] Group sessions into the correct sections.
* [ ] Render sessions in backend-provided canonical order.
* [ ] Add one Add session action per day.
* [ ] Allow the page to grow vertically for dense weeks.
* [ ] Verify today's highlight across responsive layouts.

**Exit condition:** sessions can be displayed correctly at desktop and mobile sizes.

## 17. Build session cards

* [ ] Display title.
* [ ] Display activity type.
* [ ] Display target summary.
* [ ] Display status.
* [ ] Limit titles to two lines.
* [ ] Add distinct accessible completed/skipped treatments.
* [ ] Ensure status does not rely on colour alone.
* [ ] Make cards keyboard-operable for editing.

**Exit condition:** the week is scannable without opening individual sessions.

## 18. Build the session editor shell

* [ ] Implement a right-hand sheet for desktop/tablet.
* [ ] Implement full-screen presentation on mobile.
* [ ] Keep the selected session in React state.
* [ ] Implement create and edit modes.
* [ ] Implement dirty-form detection.
* [ ] Add discard confirmation.
* [ ] Prevent autosave.

**Exit condition:** sessions can be opened/closed safely without losing unsaved work accidentally.

## 19. Implement run creation/editing

* [ ] Add title/date/time/description controls.
* [ ] Add explicit run target-mode selector.
* [ ] Add kilometre distance input.
* [ ] Add `mm:ss` / `hh:mm:ss` duration input.
* [ ] Add single/range `mm:ss /km` pace input.
* [ ] Convert display values into canonical API units.
* [ ] Show live derived-target preview.
* [ ] Validate using the shared Zod contract.
* [ ] Submit through the typed API client.
* [ ] Use confirmed mutations.
* [ ] Keep the form open after errors.
* [ ] Display field and form-level errors inline.

**Exit condition:** a runner can create and edit valid scheduled run sessions.

## 20. Implement strength creation/editing

* [ ] Add title/date/time/description controls.
* [ ] Add optional target duration.
* [ ] Allow sessions with no target duration.
* [ ] Reuse shared editor behavior and validation.
* [ ] Submit through the typed API client.

**Exit condition:** a runner can create and edit scheduled strength sessions.

## 21. Implement completion flows

* [ ] Add explicit Mark completed action.
* [ ] For runs, prompt for optional actual distance/duration.
* [ ] For strength, prompt for optional actual duration.
* [ ] Confirm completion via the dedicated endpoint.
* [ ] Display derived actual pace where applicable.
* [ ] Allow later correction of actual values.
* [ ] Respect terminal-state prescription locks.

**Exit condition:** both activity types can be completed and corrected.

## 22. Implement skip/reset flows

* [ ] Add Mark skipped.
* [ ] Require a 1–500 character skip reason.
* [ ] Add Return to scheduled.
* [ ] Confirm destructive reset before submission.
* [ ] Clear actual metrics during completion reset.
* [ ] Clear skip reason during skip reset.
* [ ] Prevent direct completed ↔ skipped transitions.
* [ ] Allow skip-reason correction while skipped.

**Exit condition:** all supported lifecycle transitions work correctly.

## 23. Implement deletion

* [ ] Add Delete to existing-session edit mode.
* [ ] Add confirmation.
* [ ] Call hard-delete endpoint.
* [ ] Handle failure inline.
* [ ] Remove/refetch the affected week after success.

**Exit condition:** sessions can be safely removed.

## 24. Add targeted React component tests

* [ ] Test run target-mode behavior.
* [ ] Test live derived metric display.
* [ ] Test validation error rendering.
* [ ] Test completion interactions.
* [ ] Test skip-reason requirements.
* [ ] Test reset confirmation.
* [ ] Test dirty-form discard behavior.
* [ ] Test locked terminal-state controls.
* [ ] Prefer behavioral assertions over snapshots.

**Exit condition:** behavior-heavy client interactions have automated coverage.

## 25. Accessibility pass

* [ ] Test keyboard navigation.
* [ ] Test focus behavior for sheets and dialogs.
* [ ] Verify labels and descriptions.
* [ ] Verify validation announcements.
* [ ] Check status communication without colour.
* [ ] Check contrast.
* [ ] Check responsive behavior at zoomed viewport sizes.
* [ ] Address WCAG 2.2 AA issues discovered.

**Exit condition:** the planner and forms meet the agreed accessibility baseline.

## 26. Add operational endpoints and logging

* [ ] Add liveness endpoint.
* [ ] Add readiness endpoint with PostgreSQL verification.
* [ ] Add structured JSON server logging.
* [ ] Add/generate request correlation IDs.
* [ ] Prevent wholesale request-body logging.
* [ ] Verify stdout/stderr behavior in the Docker image.

**Exit condition:** the service is suitable for basic Kubernetes-style operation.

## 27. Finalize deployment mechanics

* [ ] Ensure the production application is stateless.
* [ ] Verify environment-only runtime configuration.
* [ ] Add a dedicated migration command/job entry point.
* [ ] Verify migrations do not run on normal app startup.
* [ ] Exercise migration → app rollout ordering.
* [ ] Verify readiness behavior during database unavailability.
* [ ] Verify multiple application replicas can safely share PostgreSQL using the configured pool limits.

**Exit condition:** the image is suitable for deployment to a conventional public-cloud/Kubernetes environment.

## 28. Complete the V1 CI gate

Require all of the following before merge/release:

* [ ] pnpm locked install;
* [ ] TypeScript check;
* [ ] ESLint;
* [ ] Prettier;
* [ ] unit tests;
* [ ] component tests;
* [ ] PostgreSQL/Testcontainers integration tests;
* [ ] migration consistency;
* [ ] Next.js production build;
* [ ] Docker image build.

## 29. Perform V1 acceptance review

Verify that a user can:

* [ ] open the current Monday–Sunday week;
* [ ] navigate previous/next weeks;
* [ ] return to today;
* [ ] see today highlighted;
* [ ] create a run;
* [ ] create a strength session;
* [ ] edit a scheduled session;
* [ ] move a scheduled session between days/time buckets;
* [ ] complete a run with or without actuals;
* [ ] complete a strength session with or without actual duration;
* [ ] correct completion details;
* [ ] skip a session with a required reason;
* [ ] correct a skip reason;
* [ ] reset a terminal session with confirmation;
* [ ] delete a session;
* [ ] recover manually from loading/write failures;
* [ ] use the planner at desktop and mobile widths;
* [ ] operate the primary interactions by keyboard.

Once these pass, V1 should be considered complete enough to begin discovering the next layer of requirements through actual use rather than further speculative design.
