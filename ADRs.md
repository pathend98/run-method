# ADR-001: Application Architecture

**Status:** Accepted
**Date:** 2026-08-19

## Context

V1 is a single-user web application for viewing and editing a runner's weekly training. It must use a real backend and database while remaining suitable for future non-web clients.

## Decision

Use a single-package TypeScript application with:

* Node.js 24
* pnpm
* Next.js + React
* Next.js App Router
* strict TypeScript
* Tailwind CSS + CSS Modules
* selectively customized shadcn/ui
* React Hook Form + Zod
* TanStack Query
* date-fns

The application will initially be one deployable Next.js service.

Maintain explicit internal boundaries:

```text
src/
  api-client/   # Typed HTTP client
  app/          # Next.js pages and HTTP routes
  components/   # UI
  db/           # Persistence
```

Route handlers and React components should remain thin. Business logic belongs in the domain/application layers.

## Consequences

This introduces more structure than a minimal prototype, but avoids coupling domain logic directly to Next.js and leaves a clean path for future clients.

A monorepo is not required in V1.

---

# ADR-002: HTTP API and Contracts

**Status:** Accepted
**Date:** 2026-08-19

## Context

Although the web frontend and backend initially share a deployment, future clients may include mobile applications or other integrations.

## Decision

The frontend communicates with the backend through an explicit versioned JSON HTTP API:

```text
/api/v1/...
```

Use:

* Zod as the shared runtime contract;
* a thin typed `fetch` client;
* TanStack Query for server state;
* standardized API error responses;
* generated OpenAPI documentation;
* development-only Swagger UI.

The API is same-origin only in V1.

Session retrieval uses:

```text
GET /api/v1/training-sessions?from=YYYY-MM-DD&to=YYYY-MM-DD
```

with inclusive dates and a maximum 31-day range.

Successful writes return the complete resulting session representation. Deletes return `204`.

Status transitions use dedicated endpoints rather than generic updates:

```text
POST  /:id/complete
POST  /:id/skip
POST  /:id/reset

PATCH /:id/completion
PATCH /:id/skip
```

Generic `PATCH /:id` cannot change status, actual metrics, or skip reason.

## Consequences

The web UI pays a small amount of HTTP/API overhead now but future clients can reuse the same contract without extracting an API later.

---

# ADR-003: Persistence and Database

**Status:** Accepted
**Date:** 2026-08-19

## Context

Training data is expected to become increasingly relational and analytical. Future coaching workflows may query training history across sessions and time windows.

Nested workout structures may also emerge later.

## Decision

Use:

* PostgreSQL
* Drizzle ORM + Drizzle Kit
* `node-postgres` with bounded connection pooling

Prefer relational modelling for core domain data. PostgreSQL `jsonb` remains available for genuinely hierarchical structures if later required.

The initial schema uses:

```text
training_sessions
run_details
strength_details
```

Activity-detail tables have one-to-one foreign-key relationships with `training_sessions`.

Use:

* UUID primary keys;
* `ON DELETE CASCADE`;
* `created_at` and `updated_at` as `TIMESTAMPTZ`;
* application-managed `updated_at`;
* text columns with `CHECK` constraints rather than PostgreSQL enums;
* hard deletes;
* database transactions for aggregate writes.

`order` in the domain/API maps to `sort_order` in PostgreSQL.

Start with a composite index supporting weekly retrieval:

```text
(date, time_of_day, sort_order)
```

Add further indexes only when query patterns justify them.

Drizzle migrations are generated, reviewed, committed, and applied as a separate deployment step rather than during application startup.

## Consequences

PostgreSQL provides strong relational querying and constraints while retaining enough flexibility for future nested workout prescriptions.

Cross-table domain invariants remain primarily application-enforced rather than trigger-enforced.

---

# ADR-004: Training Session Domain Model

**Status:** Accepted
**Date:** 2026-08-19

## Decision

V1 supports:

```text
RUN
STRENGTH
```

A training session contains shared fields including:

```text
id
title
date
activityType
status
timeOfDay
order
description
skipReason
createdAt
updatedAt
```

`activityType` is immutable after creation.

Statuses are:

```text
SCHEDULED
COMPLETED
SKIPPED
```

Time-of-day is:

```text
AM
PM
null -> Any time
```

### Run targets

A run must contain exactly two authoritative dimensions:

```text
DISTANCE_DURATION
DISTANCE_PACE
DURATION_PACE
```

Represent this using a discriminated union in the domain/API and persist the target discriminator in PostgreSQL.

Canonical units are:

* distance: whole metres;
* duration: whole seconds;
* pace: whole seconds per kilometre.

The backend derives the missing third metric.

Derived values are not persisted independently.

### Run actuals

Completed runs may optionally contain:

```text
actualDistanceMetres
actualDurationSeconds
```

Either, both, or neither may be supplied.

Actual pace is derived when both exist.

### Strength

Strength sessions require only the shared required fields.

V1 optionally supports:

```text
targetDurationSeconds
actualDurationSeconds
```

Exercise/set modelling is deferred.

### Lifecycle

New sessions default to `SCHEDULED`.

Completion and skipping are explicit transitions.

Skipping requires a non-empty `skipReason`.

Resetting to `SCHEDULED`:

* clears actual metrics after completion;
* clears `skipReason` after skipping;
* requires confirmation in the UI.

Direct `COMPLETED ↔ SKIPPED` transitions are forbidden.

While terminal:

* title and description remain editable;
* date, time-of-day, and prescription are locked.

Terminal-state actuals or skip reasons may still be corrected through dedicated operations.

## Consequences

The model prioritizes explicit invariants and type safety while leaving richer workout structures for later requirements.

---

# ADR-005: Weekly Planner UX

**Status:** Accepted
**Date:** 2026-08-19

## Decision

The planner displays Monday–Sunday weeks.

The browser's local timezone determines today and the current week. Session dates remain timezone-free `YYYY-MM-DD` calendar dates.

The selected week is represented as:

```text
/training?week=<Monday YYYY-MM-DD>
```

Non-Monday values are normalized to the corresponding Monday.

### Layout

Desktop/tablet:

* seven day columns.

Mobile:

* days stacked vertically.

Each day contains:

```text
AM
Any time
PM
```

Each day has one **Add session** action.

Today's date is highlighted on all devices.

The page grows vertically for dense weeks rather than creating independently scrolling day columns.

### Session cards

Cards show:

* title;
* activity type;
* target summary;
* status.

Titles are limited to two lines.

Descriptions and actual metrics are shown only in the editor.

Completed and skipped sessions remain in their original planner position.

### Editor

Desktop/tablet uses a right-hand sheet.

Mobile uses a full-screen sheet/overlay.

There is no autosave.

Unsaved changes require discard confirmation.

Run entry uses an explicit target-mode selector:

```text
Distance + Duration
Distance + Pace
Duration + Pace
```

The derived third metric is shown live but recalculated authoritatively by the backend.

Status changes use explicit actions such as:

```text
Mark completed
Mark skipped
Return to scheduled
```

### Ordering

Display order is:

1. date;
2. AM → Any time → PM;
3. `order`;
4. deterministic tie-breaker.

Order values need not be contiguous.

Moving a session to another date or time bucket appends it to the destination bucket.

## Consequences

The planner remains compact and scannable while still supporting double-session days and responsive mobile use.

---

# ADR-006: Quality, Testing, and Deployment

**Status:** Accepted
**Date:** 2026-08-19

## Decision

### Testing

Use:

* Vitest for unit/integration tests;
* React Testing Library for targeted component tests;
* Testcontainers with real PostgreSQL for integration tests.

Required coverage includes:

* domain calculations and validation;
* state transitions;
* persistence and constraints;
* HTTP API behavior;
* behavior-heavy React components.

End-to-end browser testing is deferred.

### CI

CI must pass:

* locked pnpm install;
* strict TypeScript checking;
* ESLint;
* Prettier;
* unit tests;
* component tests;
* PostgreSQL integration tests;
* migration consistency checks;
* Next.js production build;
* Docker image build.

### Deployment

The application is:

* stateless;
* container-friendly;
* cloud-provider agnostic;
* suitable for Kubernetes;
* externally configured through environment variables.

Database migrations run as a dedicated deployment job.

Expose separate liveness and readiness endpoints. Readiness checks PostgreSQL connectivity.

Server logs are structured and written to stdout/stderr with request/correlation context.

### Other requirements

* WCAG 2.2 AA baseline;
* modern evergreen browsers only;
* light mode only;
* no authentication in V1.

Until authentication is introduced, deployments should be regarded as private/internal.

## Consequences

V1 carries some infrastructure and test cost, particularly PostgreSQL-backed integration tests, in exchange for confidence that application behavior matches the real deployment environment.

---

