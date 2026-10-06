# UI Ownership

Organise browser-side code by ownership and reason to change. Start with business domains such as `training-sessions`, `training-goals`, and `users`, then group each domain by capability.

Keep capability-specific code local. Promote it to the domain only when several capabilities use it, and to `shared/` only when unrelated domains use it. A planner used to organise training sessions belongs to `training-sessions`; its calendar and weekly summary stay private while they have only that owner.

Name private folders by responsibility: `presentation/`, `form/`, `api/`, `validation/`, `calendar/`, `calculation/`, or `formatters/`. Avoid vague `utils/`, `helpers/`, and catch-all `services/` folders in new or reorganised code.

Separate business rules, presentation, and infrastructure. Business rules shared with the server belong in `src/domain/`; UI display formatting and rendering remain browser-side, and HTTP access belongs in API infrastructure. Dependencies point from capabilities toward their domain and shared concepts, never from general code into capability internals.

Each module declares its narrow public API in an `index.ts` file. Use explicit named exports and `export type`, never wildcard exports. For example, `training-sessions/training-planner/index.ts` exposes the planner component, while `training-sessions/training-session-dialogs/index.ts` exposes shared dialog coordination. Consumers import from the module folder path; concrete implementation files stay behind that interface.

Within a module, import implementation files directly rather than its own index. Private responsibility folders do not automatically need indexes, and domain folders do not need aggregate barrels. Keep the weekly summary private to the planner.

Each `.tsx` file defines exactly one React component. Colocate unit tests with their implementations; unit tests may import those files directly, while cross-module and integration tests use public indexes. Indexes containing only export declarations do not require colocated tests. Existing modules can be migrated incrementally as their ownership is clarified.

## ESLint enforcement

`architecture/ui-module-boundaries` protects the immediate module folders under `src/ui/training-sessions`, for consumers throughout `src/`, including tests. Other UI domains can be added to `moduleRoots` in the ESLint config as they migrate.

External consumers must import the module folder, backed by `index.ts`, rather than implementation files or explicit index paths. Inside a module, direct implementation imports are allowed, including unit tests; importing its own index is rejected. Public indexes must use explicit exports rather than wildcard exports.

The rule checks relative paths and the `@/` alias in imports, re-exports, TypeScript import types, literal dynamic imports and `require` calls, and literal `vi.mock`, `vi.doMock`, `vi.unmock`, `vi.doUnmock`, `vi.importActual`, and `vi.importMock` paths. Computed paths, packages, and unprotected modules are outside its enforcement. Business ownership still requires review. The rule reports violations without autofixing because the required symbol may not be publicly exported.
