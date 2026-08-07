import { HttpErrorResponse } from '@angular/common/http';
import { BrowserQueryParam } from '@kratos-pages/shared/models/browser';
import { ErrorCustom, ErrorEnum, ErrorStatusEnum } from '@kratos-pages/shared/models/error';
import { API_TOKEN_URL } from '@env/environment';
import {
  GenericError,
  LoginFlow,
  LogoutFlow,
  RecoveryFlow,
  RegistrationFlow,
  SettingsFlow,
  VerificationFlow,
} from '@ory/client';
import { EMPTY, Observable, catchError, of } from 'rxjs';
export const redirect = {
  to: (url: string): void => {
    window.location.href = url;
  },
};

/**
 * Handle error on Login and Registration flow
 *
 *
 * @param flow$
 * @returns flow$ with a catchError pipe
 *
 * @exports
 */
export function LoginRegisterFlowErrorHandler(flow$: Observable<LoginFlow | RegistrationFlow>) {
  return flow$.pipe(
    catchError((err: HttpErrorResponse) => {
      const genError = err.error.error as GenericError;

      console.log(genError, genError.code, genError.id);

      switch (genError.code) {
        case 400:
          if (genError.id === ErrorEnum.SessionAlreadyAvailable) {
            // Kratos still has a session: mint fresh tokens, but return to the
            // caller's return_to (e.g. the re-login worker page) instead of the
            // default, so a session-recovery popup can signal the tab that opened it.
            const returnTo =
              new URLSearchParams(window.location.search).get(BrowserQueryParam.ReturnTo) ||
              window.location.origin;
            redirect.to(`${API_TOKEN_URL}?return_to=${returnTo}`);
          }
          if (genError.id === ErrorEnum.ReturnToForbidden) {
            redirect.to(`${window.location.origin}/auth/login`);
          }
          break;
        case 403:
          console.log('Handle 403');
          break;
        case 404:
          if (genError.status === ErrorStatusEnum.NotFound) {
            redirect.to(window.location.origin);
          } else {
            console.log('Handle 404');
          }

          break;
        case 410:
          if (genError.details['redirect_to']) {
            redirect.to(genError.details['redirect_to']);
          }
          break;

        default:
          break;
      }

      return EMPTY;
    })
  );
}

/**
 * Handle error on Settings flow
 *
 *
 * @param flow$
 * @returns flow$ with a catchError pipe
 *
 * @exports
 */
export function SettingsFlowErrorHandler(flow$: Observable<SettingsFlow>) {
  return flow$.pipe(
    catchError((err: HttpErrorResponse) => {
      const genError = err.error.error as GenericError;

      console.log(genError, genError.code, genError.id);

      switch (genError.code) {
        case 401:
          if (genError.id === ErrorEnum.SessionInactive) {
            redirect.to(
              `${window.location.origin}/auth/login?${BrowserQueryParam.ReturnTo}=${encodeURIComponent(location.href)}`
            );
          }
          break;
        default:
          console.log('Handle error !');
          break;
      }

      return EMPTY;
    })
  );
}

/**
 * Handle error on Recovery flow
 *
 *
 * @param flow$
 * @returns flow$ with a catchError pipe
 *
 * @exports
 */
export function RecoveryFlowErrorHandler(flow$: Observable<RecoveryFlow>) {
  return flow$.pipe(
    catchError((err: HttpErrorResponse) => {
      const genError = err.error.error as GenericError;

      console.log(genError, genError.code, genError.id);

      switch (genError.code) {
        case 400:
          if (genError.status === ErrorStatusEnum.BadRequest && genError.reason) {
            const id = getCustomErrorId(genError.reason);

            const err: RecoveryFlow = {
              ui: {
                messages: [{ id, type: 'error', text: genError.reason }],
                action: '',
                method: '',
                nodes: [],
              },
              id: '',
              expires_at: '',
              issued_at: '',
              request_url: '',
              state: '',
              type: '',
            };
            return of(err);
          } else {
            console.log('Handle 404');
          }

          break;

        default:
          console.log('Handle error !');
          break;
      }

      return EMPTY;
    })
  );
}

/**
 * Handle error on Logout flow
 *
 *
 * @param flow$
 * @returns flow$ with a catchError pipe
 *
 * @exports
 */
export function VerificationFlowErrorHandler(flow$: Observable<VerificationFlow>) {
  return flow$.pipe(
    catchError((err: HttpErrorResponse) => {
      const genError = err.error.error as GenericError;

      console.log(genError, genError.code, genError.id);

      switch (genError.code) {
        case 401:
          if (genError.id === ErrorEnum.SessionInactive) {
            redirect.to(window.location.origin);
          }
          break;
        default:
          console.log('Handle error !');

          break;
      }

      return EMPTY;
    })
  );
}

/**
 * Handle error on Logout flow
 *
 *
 * @param flow$
 * @returns flow$ with a catchError pipe
 *
 * @exports
 */
export function LogoutFlowErrorHandler(flow$: Observable<LogoutFlow>) {
  return flow$.pipe(
    catchError((err: HttpErrorResponse) => {
      const genError = err.error.error as GenericError;

      console.log(genError, genError.code, genError.id);

      switch (genError.code) {
        case 401:
          if (genError.id === ErrorEnum.SessionInactive) {
            redirect.to(window.location.origin);
          }
          break;
        default:
          console.log('Handle error !');

          break;
      }

      return EMPTY;
    })
  );
}

function getCustomErrorId(reason: string) {
  if (reason) {
    console.log(ErrorCustom);

    return ErrorCustom.get(reason) || 0;
  } else {
    return 0;
  }
}
