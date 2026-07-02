API_URL = 'api.dev.superphenix.net';

// environment.js
window.$environment = {
  production: false,
  appName: 'Superphenix Console',
  url: {
    http: 'https://' + API_URL,
    ws: 'wss://' + API_URL,
    auth: 'http://localhost:3000',
  },
  session: {
    token: 'https://' + API_URL + '/v1/session',
    whoami: 'https://' + API_URL + '/v1/whoami',
    autoRenew: 10,
  },
  api: {
    agat: '/v1',
    organization: '/v1/organization',
    controller: '/api/spx-ctrl',
  },
  supportEmail: 'contact@superphenix.net',
  helpLinks: [
    { icon: 'live_help', text: 'Support', url: 'https://github.com/super-phenix/superphenix/issues' },
    { icon: 'docs', text: 'Documentation', url: 'https://docs.superphenix.net' },
    { icon: 'commit', text: 'Changelog', url: '' },
  ],
};
