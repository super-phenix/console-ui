// environment.js
window.$environment = {
  production: false,
  appName: 'Superphenix Console',
  apiUrl: 'localhost:8080',
  authUrl: 'http://localhost:3000',
  ssl: false,
  sessionAutoRenew: 10,
  supportEmail: 'contact@superphenix.net',
  helpLinks: [
    { icon: 'live_help', text: 'Support', url: 'https://github.com/super-phenix/superphenix/issues' },
    { icon: 'docs', text: 'Documentation', url: 'https://docs.superphenix.net' },
    { icon: 'commit', text: 'Changelog', url: '' },
  ],
};
