# UI Modules

Browser-side code lives here as deep modules. Each module folder should expose concrete top-level files for the things other modules can use, such as `training-planner/training-planner.tsx`.

Code outside a module should import from those top-level files only. Keep implementation details in `components/`, `services/`, `types/`, `utils/`, or `hooks/` inside the module.

Top-level files should not be re-export-only barrels. Each `.tsx` file should define exactly one React component.
