# UI Ownership

Organise browser-side code by ownership and reason to change. Start with business domains such as `training-sessions`, `training-goals`, and `users`, then group each domain by capability.

Keep capability-specific code local. Promote it to the domain only when several capabilities use it, and to `shared/` only when unrelated domains use it. A planner used to organise training sessions belongs to `training-sessions`; its calendar and weekly summary stay private while they have only that owner.

Name private folders by responsibility: `presentation/`, `form/`, `api/`, `validation/`, `calendar/`, `calculation/`, or `formatters/`. Avoid vague `utils/`, `helpers/`, and catch-all `services/` folders in new or reorganised code.

Separate business rules, presentation, and infrastructure. Business rules shared with the server belong in `src/domain/`; UI display formatting and rendering remain browser-side, and HTTP access belongs in API infrastructure. Dependencies point from capabilities toward their domain and shared concepts, never from general code into capability internals.

Each capability exposes a narrow API through concrete top-level files, such as `training-sessions/training-planner/training-planner.tsx`. Domain-level capabilities shared by siblings also use concrete files, such as `training-sessions/training-session-dialogs.tsx`. Consumers must use these entrypoints rather than importing private implementation files. Do not create re-export-only barrels or new `index.ts` interfaces.

Each `.tsx` file defines exactly one React component. Colocate unit tests with their implementations; cross-module tests use public entrypoints. Existing modules can be migrated incrementally as their ownership is clarified.
