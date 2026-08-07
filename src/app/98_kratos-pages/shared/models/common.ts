export declare const FlowTypeEnum: {
  readonly Error: 'error';
  readonly Login: 'login';
  readonly Recovery: 'recovery';
  readonly Registration: 'registration';
  readonly Sessions: 'sessions';
  readonly Settings: 'settings';
  readonly Verification: 'verification';
  readonly Logout: 'logout';
};
export type FlowTypeEnum = (typeof FlowTypeEnum)[keyof typeof FlowTypeEnum];
