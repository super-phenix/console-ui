<h1 align="center">Superphenix Console</h1>

<p align="center">
  <a href="https://github.com/super-phenix/console-ui/releases"><img
    src="https://img.shields.io/github/v/release/super-phenix/console-ui.svg"
    alt="Releases"
  /></a>
  <a href="https://github.com/super-phenix/console-ui/actions"><img
    src="https://github.com/super-phenix/console-ui/actions/workflows/release.yml/badge.svg"
    alt="Build"
  /></a>
  <a href="LICENSE"><img
    src="https://img.shields.io/badge/license-Apache%202.0-green.svg"
    alt="License"
  /></a>
</p>

This repository contains the code for the frontend of the Superphenix web console.

The console connects to the [Superphenix API](https://github.com/super-phenix/superphenix) and allows you to manage your resources and AZs.

## What is Superphenix?

Head to [the Superphenix Github repository](https://github.com/super-phenix/superphenix) to learn more about Superphenix.

## Requirements

- Node.js - version [^18.19.1 or newer](https://angular.dev/reference/versions)

## Development

### Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`.  
The application will automatically reload whenever you modify any of the source files.

### Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

### Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory.

### Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

### Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

## Documentations

| Document                                               | Description                                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| [Getting Started](docs/getting-started.md)             | Prerequisites, installation, environment setup, running locally, building, and Docker. |
| [Architecture](docs/architecture.md)                   | Project structure, directory layout, routing, lazy loading, and build configurations.  |
| [Development Practices](docs/development-practices.md) | Standalone components, signals, change detection, control flow, linting, and testing.  |
| [Theming](docs/theming.md)                             | Theme system, CSS custom properties, override mechanism, fonts, and branding assets.   |
| [Authentication](docs/authentication.md)               | Cookie-based session flow, JWT tokens, interceptors, and session recovery.             |
| [API Patterns](docs/api-patterns.md)                   | BaseService, URL structure, custom RxJS handlers, and error handling.                  |
| [Add a New Product](docs/add-new-product.md)           | Step-by-step guide to adding a new product to the Console UI.                          |

## License

Superphenix is open source under the [Apache License 2.0](LICENSE).
