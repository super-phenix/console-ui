export enum ErrorEnum {
  SessionAlreadyAvailable = 'session_already_available',
  ReturnToForbidden = 'self_service_flow_return_to_forbidden',
  SessionInactive = 'session_inactive',
}

export enum ErrorStatusEnum {
  NotFound = 'Not Found',
  BadRequest = 'Bad Request',
}

export const ErrorCustom = new Map([['Recovery is not allowed because it was disabled.', 1]]);

/** Kratos refuses recovery while a session exists. Restart the flow with `?refresh=true`. */
export const RECOVERY_BLOCKED_BY_SESSION = 'A valid session was detected and thus recovery is not possible';

export function isRecoveryBlockedBySession(error?: { reason?: string; message?: string }): boolean {
  const text = `${error?.reason ?? ''}\n${error?.message ?? ''}`;
  return text.includes(RECOVERY_BLOCKED_BY_SESSION);
}
