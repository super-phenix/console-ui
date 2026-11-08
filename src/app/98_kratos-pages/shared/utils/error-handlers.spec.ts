import { HttpErrorResponse } from '@angular/common/http';
import { API_LOGOUT_URL } from '@env/environment';
import { ErrorEnum, ErrorStatusEnum, RECOVERY_BLOCKED_BY_SESSION } from '@kratos-pages/shared/models/error';
import { LoginFlow, LogoutFlow, RecoveryFlow, SettingsFlow } from '@ory/client';
import { Observable, throwError } from 'rxjs';
import { kratosApiAuth } from './kratos-api-auth';
import {
  LoginRegisterFlowErrorHandler,
  LogoutFlowErrorHandler,
  RecoveryFlowErrorHandler,
  SettingsFlowErrorHandler,
  redirect,
  urlWithRecoveryRefresh,
} from './error-handlers';

function makeHttpError(
  code: number,
  id: string,
  status?: string,
  details?: Record<string, string>,
  reason?: string
): HttpErrorResponse {
  return new HttpErrorResponse({
    error: {
      error: {
        code,
        id,
        status: status ?? '',
        details: details ?? {},
        reason,
      },
    },
    status: code,
  });
}

describe('error-handlers (URL constants)', () => {
  let redirectSpy: jasmine.Spy;
  let exchangeSpy: jasmine.Spy;

  beforeEach(() => {
    redirectSpy = spyOn(redirect, 'to');
    exchangeSpy = spyOn(kratosApiAuth, 'exchange').and.resolveTo();
  });

  describe('LoginRegisterFlowErrorHandler', () => {
    it('authenticates to the API on SessionAlreadyAvailable', () => {
      const error$ = throwError(() =>
        makeHttpError(400, ErrorEnum.SessionAlreadyAvailable)
      ) as Observable<LoginFlow>;
      const next = jasmine.createSpy('next');

      LoginRegisterFlowErrorHandler(error$).subscribe(next);

      expect(exchangeSpy).toHaveBeenCalledWith(window.location.origin);
      expect(redirectSpy).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('shows the login error when the API exchange fails', async () => {
      exchangeSpy.and.rejectWith(new Error('no session'));
      const error$ = throwError(() =>
        makeHttpError(400, ErrorEnum.SessionAlreadyAvailable)
      ) as Observable<LoginFlow>;
      const next = jasmine.createSpy('next');

      LoginRegisterFlowErrorHandler(error$).subscribe(next);
      await Promise.resolve();

      expect(next).toHaveBeenCalledWith(null);
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

  describe('urlWithRecoveryRefresh', () => {
    it('adds refresh=true on the recovery page', () => {
      expect(urlWithRecoveryRefresh('https://console.example/auth/recovery?return_to=%2F')).toBe(
        'https://console.example/auth/recovery?return_to=%2F&refresh=true'
      );
    });

    it('sends the error page back to recovery with refresh=true', () => {
      expect(urlWithRecoveryRefresh('https://console.example/auth/error?id=abc&return_to=%2F')).toBe(
        'https://console.example/auth/recovery?return_to=%2F&refresh=true'
      );
    });

    it('returns null when recovery was already refreshed', () => {
      expect(urlWithRecoveryRefresh('https://console.example/auth/recovery?refresh=true')).toBeNull();
    });
  });

  describe('RecoveryFlowErrorHandler', () => {
    it('restarts recovery with refresh=true when a session blocks it', () => {
      const error$ = throwError(() =>
        makeHttpError(400, ErrorEnum.SessionAlreadyAvailable, ErrorStatusEnum.BadRequest, {}, RECOVERY_BLOCKED_BY_SESSION)
      ) as Observable<RecoveryFlow>;

      RecoveryFlowErrorHandler(error$).subscribe();

      expect(redirectSpy).toHaveBeenCalledWith(urlWithRecoveryRefresh(window.location.href)!);
    });
  });

  describe('LogoutFlowErrorHandler', () => {
    it('should call the API logout endpoint on SessionInactive', () => {
      const error$ = throwError(() =>
        makeHttpError(401, ErrorEnum.SessionInactive)
      ) as Observable<LogoutFlow>;

      LogoutFlowErrorHandler(error$).subscribe();

      expect(redirectSpy).toHaveBeenCalledWith(API_LOGOUT_URL);
    });
  });
});
