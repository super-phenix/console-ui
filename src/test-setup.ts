// Test-only bootstrap. Runs before app modules so `environment`
// (captured from window.$environment at import) is defined under Karma.
// Guarded so it never overrides a real config.
type WithEnv = typeof globalThis & { $environment?: unknown };
const w = globalThis as WithEnv;
if (!w.$environment) {
  w.$environment = {
    production: false,
    appName: 'Console Superphénix (test)',
    url: {
      http: 'https://api.test',
      ws: 'wss://api.test',
      auth: 'http://localhost:3000',
    },
    session: {
      token: 'https://api.test/v1/session',
      whoami: 'https://api.test/v1/whoami',
      autoRenew: 10,
    },
    api: {
      agat: '/v1',
      organization: '/v1/organization',
      controller: '/api/spx-ctrl',
    },
    supportEmail: 'support@email.com',
    helpLinks: [
      { icon: 'live_help', text: 'Support', url: 'https://support.test' },
      { icon: 'docs', text: 'Documentation', url: 'https://docs.test' },
    ],
  };
}
