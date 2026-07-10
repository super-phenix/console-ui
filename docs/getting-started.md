# Getting Started

## Prerequisites

| Tool            | Version                                                                        |
| --------------- | ------------------------------------------------------------------------------ |
| **Node.js**     | v26+ ([Angular version compatibility](https://angular.dev/reference/versions)) |
| **npm**         | Bundled with Node.js                                                           |
| **Angular CLI** | Installed globally (`npm install -g @angular/cli`) or use `npx ng`             |

Access to the **Superphenix API** (backend) is required for full functionality.

## Installation

```bash
git clone <repository-url>
cd console-ui
npm install
```

## Environment Setup

The application uses a **runtime environment configuration** injected via `window.$environment` in a JavaScript file. This allows changing API URLs and settings **without rebuilding** the app.

### Local Development

A pre-configured local environment file exists at `public/local/environment.js`. Start the app with:

```bash
npm run start:local
```

This swaps `public/environnement.js` for `public/local/environment.js` automatically.

### Custom Environments

Copy the template and adjust the values:

```bash
cp public/local/environment.js public/environnement.js
```

Edit `public/environnement.js` to point to your API:

```javascript
const API_URL = 'your-api-host:port';

window.$environment = {
  production: false,
  appName: 'Superphenix Console',
  url: {
    http: 'http://' + API_URL,
    ws: 'ws://' + API_URL,
    auth: 'http://your-auth-server:3000',
  },
  session: {
    token: 'http://' + API_URL + '/v1/session',
    whoami: 'http://' + API_URL + '/v1/whoami',
    autoRenew: 10,
  },
  api: {
    agat: '/v1',
    organization: '/v1/organization',
    controller: '/api/spx-ctrl',
  },
  supportEmail: 'support@email.com',
  helpLinks: [],
};
```

> The shape of `window.$environment` must match the `Environment` interface in `src/environments/environment.ts`.

## Running the Development Server

```bash
# Local configuration (local backend)
npm run start:local

# Default development configuration
npm run start
```

The application will be available at `http://localhost:4200/`.

## Building

```bash
npm run build          # Production build
npm run build:local    # Build with local configuration
npm run watch          # Incremental build in watch mode
```

Build output is placed in the `dist/` directory. See [Architecture — Build Configurations](./architecture.md#build-configurations) for details on each configuration.

## Docker

A `Dockerfile.local` is provided to build and serve the app via Nginx:

```bash
docker build -f Dockerfile.local -t console-ui .
docker run -p 8080:80 console-ui
```

The app will be available at `http://localhost:8080/`.
