# Project Architecture

## Overview

Console UI is a modern Angular web application that serves as the frontend for the Superphenix web console. It uses standalone components, zoneless change detection, and a modular feature-based structure.

## Directory Structure

The source code under `src/app/` is organized into numbered directories:

| Directory          | Purpose                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| `00_public/`       | Publicly accessible pages (redirects, OAuth callbacks, inactive account, WIP).                       |
| `01_common/`       | Core layout and shell components: header, sidenav, context selector, and the main wrapper.           |
| `02_dashboard/`    | Application dashboard and changelog views.                                                           |
| `03_products/`     | Feature modules organized by product category (see below).                                           |
| `04_user/`         | User profile and details management.                                                                 |
| `05_organization/` | Organization management: settings, projects, users, IAM, and details.                                |
| `99_shared/`       | Cross-cutting concerns: shared components, directives, services, models, HTTP utilities, and guards. |

### Product Categories (`03_products/`)

| Sub-directory       | Category                         |
| ------------------- | -------------------------------- |
| `00_shared/`        | Shared product utilities.        |
| `01_compute/`       | Compute resources.               |
| `02_storage/`       | Storage resources.               |
| `03_network/`       | Network resources.               |
| `04_paas/`          | Platform-as-a-Service resources. |
| `99_uncategorized/` | Uncategorized products.          |

### Where to Put New Code

| Type                     | Location                          |
| ------------------------ | --------------------------------- |
| Feature component        | `src/app/03_products/<category>/` |
| Shared component/service | `src/app/99_shared/`              |
| Layout component         | `src/app/01_common/`              |
| User management          | `src/app/04_user/`                |
| Organization management  | `src/app/05_organization/`        |

> Add code to `99_shared/` only if it is used by **multiple features**. Feature-specific code stays in its feature folder.

## Routing and Lazy Loading

The application uses Angular's lazy loading via `loadChildren` to split feature routes into separate bundles. Each product category and major feature area has its own route file (e.g., `storage.routes.ts`, `network.routes.ts`) loaded on demand.

Top-level routes are defined in `src/app/app.routes.ts`.

## Application Configuration

The application is bootstrapped with `ApplicationConfig` in `src/app/app.config.ts`. Key providers:

- **`provideZonelessChangeDetection()`** — the app runs without Zone.js.
- **`provideHttpClient(withInterceptors(...))`** — HTTP client with token, auth-error, and general error interceptors.
- **`provideRouter(routes)`** — router with lazy-loaded feature routes.
- Angular Material default options for snack bars, form fields, cards, dialogs, and steppers.

## Build Configurations

Three build configurations are defined in `angular.json`:

| Configuration   | Description                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| **production**  | Optimized build with output hashing and bundle budgets. Default for `ng build`.                       |
| **development** | Unoptimized build with source maps. Default for `ng serve`.                                           |
| **local**       | Same as development, but swaps `public/environnement.js` with `public/local/environment.js`. No HMR. |

## Environments

Environment-specific settings are managed via a **runtime configuration** injected through `window.$environment`. This allows changing API URLs and settings without rebuilding. See [Getting Started — Environment Setup](./getting-started.md#environment-setup) for details.

The `Environment` interface is defined in `src/environments/environment.ts`.
