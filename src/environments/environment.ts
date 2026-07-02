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
  url: {
    http: string;
    ws: string;
    auth: string;
  };
  session: {
    token: string;
    whoami: string;
    autoRenew: number;
  };
  api: {
    agat: string;
    organization: string;
    controller: string;
  };
  supportEmail: string;
  helpLinks?: HelpLink[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const environment = (window as any).$environment as Environment;
