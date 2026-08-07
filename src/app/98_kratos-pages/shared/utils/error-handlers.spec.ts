import { HttpErrorResponse } from '@angular/common/http';
import { ErrorEnum, ErrorStatusEnum } from '@kratos-pages/shared/models/error';
import { API_TOKEN_URL } from '@env/environment';
import { LoginFlow, LogoutFlow, SettingsFlow } from '@ory/client';
import { Observable, throwError } from 'rxjs';
import {
  LoginRegisterFlowErrorHandler,
  LogoutFlowErrorHandler,
  SettingsFlowErrorHandler,
  redirect,
} from './error-handlers';

function makeHttpError(code: number, id: string, status?: string, details?: Record<string, string>): HttpErrorResponse {
  return new HttpErrorResponse({
    error: {
      error: {
        code,
        id,
        status: status ?? '',
        details: details ?? {},
      },
    },
    status: code,
  });
}

describe('error-handlers (URL constants)', () => {
  let redirectSpy: jasmine.Spy;

  beforeEach(() => {
    redirectSpy = spyOn(redirect, 'to');
  });

  describe('LoginRegisterFlowErrorHandler', () => {
    it('should redirect to API_TOKEN_URL on SessionAlreadyAvailable', () => {
      const error$ = throwError(() =>
        makeHttpError(400, ErrorEnum.SessionAlreadyAvailable)
      ) as Observable<LoginFlow>;

      LoginRegisterFlowErrorHandler(error$).subscribe();

      expect(redirectSpy).toHaveBeenCalledWith(
        jasmine.stringContaining(API_TOKEN_URL)
      );
    });

    it('should use window.location.origin as default return_to', () => {
      const error$ = throwError(() =>
        makeHttpError(400, ErrorEnum.SessionAlreadyAvailable)
      ) as Observable<LoginFlow>;

      LoginRegisterFlowErrorHandler(error$).subscribe();

      expect(redirectSpy).toHaveBeenCalledWith(
        `${API_TOKEN_URL}?return_to=${window.location.origin}`
      );
    });

    it('should redirect to /auth/login on ReturnToForbidden', () => {
      const error$ = throwError(() =>
        makeHttpError(400, ErrorEnum.ReturnToForbidden)
      ) as Observable<LoginFlow>;

      LoginRegisterFlowErrorHandler(error$).subscribe();

      expect(redirectSpy).toHaveBeenCalledWith(`${window.location.origin}/auth/login`);
    });

    it('should redirect to window.location.origin on 404 NotFound', () => {
      const error$ = throwError(() =>
        makeHttpError(404, '', ErrorStatusEnum.NotFound)
      ) as Observable<LoginFlow>;

      LoginRegisterFlowErrorHandler(error$).subscribe();

      expect(redirectSpy).toHaveBeenCalledWith(window.location.origin);
    });
  });

  describe('SettingsFlowErrorHandler', () => {
    it('should redirect to /auth/login on SessionInactive', () => {
      const error$ = throwError(() =>
        makeHttpError(401, ErrorEnum.SessionInactive)
      ) as Observable<SettingsFlow>;

      SettingsFlowErrorHandler(error$).subscribe();

      expect(redirectSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('/auth/login')
      );
    });
  });

  describe('LogoutFlowErrorHandler', () => {
    it('should redirect to window.location.origin on SessionInactive', () => {
      const error$ = throwError(() =>
        makeHttpError(401, ErrorEnum.SessionInactive)
      ) as Observable<LogoutFlow>;

      LogoutFlowErrorHandler(error$).subscribe();

      expect(redirectSpy).toHaveBeenCalledWith(window.location.origin);
    });
  });
});
