// Test-only bootstrap. Runs before app modules so `environment`
// (captured from window.$environment at import) is defined under Karma.
// Guarded so it never overrides a real config.
type WithEnv = typeof globalThis & { $environment?: unknown };
const w = globalThis as WithEnv;
if (!w.$environment) {
  w.$environment = {
    production: false,
    appName: 'Console Superphénix (test)',
    apiUrl: 'api.test',
    authUrl: 'http://localhost:4433',
    ssl: true,
    sessionAutoRenew: 10,
    supportEmail: 'support@email.com',
    helpLinks: [
      { icon: 'live_help', text: 'Support', url: 'https://support.test' },
      { icon: 'docs', text: 'Documentation', url: 'https://docs.test' },
    ],
  };
}

// There is no API under Karma. A request left unmocked stays pending: its failure would otherwise land in another
// spec, or redirect the test page to the login.
globalThis.fetch = () => new Promise(() => undefined);
XMLHttpRequest.prototype.send = () => undefined;
