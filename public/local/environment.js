const API_URL = 'localhost:8080';

// environment.js
window.$environment = {
  production: false,
  appName: 'Superphenix Console',
  url: {
    http: 'http://' + API_URL,
    ws: 'ws://' + API_URL,
    auth: 'http://localhost:3000',
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
  supportEmail: 'contact@superphenix.net',
  helpLinks: [
    { icon: 'live_help', text: 'Support', url: 'https://github.com/super-phenix/superphenix/issues' },
    { icon: 'docs', text: 'Documentation', url: 'https://docs.superphenix.net' },
    { icon: 'commit', text: 'Changelog', url: '' },
  ],
};
