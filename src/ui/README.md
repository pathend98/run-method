# UI Modules

Browser-side code lives here as deep modules. Each module folder should expose concrete top-level files for the things other modules can use, such as `training-planner/training-planner.tsx`.

Code outside a module should import from those top-level files only. Keep implementation details in `components/`, `services/`, `types/`, `utils/`, or `hooks/` inside the module.

The top-level `components/` folder is reserved for a deliberately small set of reusable, feature-agnostic React components. Only move a component there after it has demonstrated genuine reuse across feature modules. Keep feature-specific components in the owning module's private `components/` folder.

Top-level files should not be re-export-only barrels. Each `.tsx` file should define exactly one React component.
