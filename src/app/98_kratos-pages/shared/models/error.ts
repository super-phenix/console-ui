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
