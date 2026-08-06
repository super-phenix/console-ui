export interface HelpLink {
  /** Material icon name (see https://fonts.google.com/icons). */
  icon: string;
  text: string;
  url: string;
}

// this interface is just to making things more typed
interface Environment {
  production: boolean;
  appName: string;
  apiUrl: string;
  authUrl: string;
  ssl: boolean;
  sessionAutoRenew: number;
  supportEmail: string;
  helpLinks?: HelpLink[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const environment = (window as any).$environment as Environment;

export const CONTROLLER_PATH = '/api/spx-ctrl';
export const API_ENDPOINT = '/v1';
export const HTTP_PROTOCOL = environment.ssl ? 'https://' : 'http://';
export const WS_PROTOCOL = environment.ssl ? 'wss://' : 'ws://';
