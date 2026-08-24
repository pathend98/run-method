# UI Modules

Browser-side code lives here as deep modules. Each module folder should expose a same-name public interface file at its root, such as `training-planner/training-planner.ts`.

Code outside a module should import from that interface file only. Keep implementation details in `components/`, `services/`, `types/`, `utils/`, or `hooks/` inside the module.
