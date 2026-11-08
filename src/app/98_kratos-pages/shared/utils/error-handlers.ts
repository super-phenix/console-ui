import { HttpErrorResponse } from '@angular/common/http';
import { API_LOGOUT_URL } from '@env/environment';
import { BrowserQueryParam } from '@kratos-pages/shared/models/browser';
import {
  ErrorCustom,
  ErrorEnum,
  ErrorStatusEnum,
  isRecoveryBlockedBySession,
} from '@kratos-pages/shared/models/error';
import { writeStoredAccessToken } from '@shared/services/access-token-storage';
import { redirectLimit } from '@shared/utils/redirect-limit';
import {
  GenericError,
  LoginFlow,
  LogoutFlow,
  RecoveryFlow,
  RegistrationFlow,
  SettingsFlow,
  VerificationFlow,
} from '@ory/client';
import { EMPTY, Observable, catchError, from, of, switchMap } from 'rxjs';
import { kratosApiAuth } from '@kratos-pages/shared/utils/kratos-api-auth';
export const redirect = {
  to: (url: string): void => {
    redirectLimit.to(url);
  },
};

/**
 * Address that restarts recovery with `refresh=true`.
 * Returns null when this page is already that request, so a second failure is not a loop.
 */
export function urlWithRecoveryRefresh(currentHref: string): string | null {
  const here = new URL(currentHref);
  const onRecovery = here.pathname.endsWith('/recovery');
  if (onRecovery && here.searchParams.get(BrowserQueryParam.Refresh) === 'true') {
    return null;
  }

  const next = onRecovery ? here : new URL('/auth/recovery', here.origin);
  if (!onRecovery) {
    const returnTo = here.searchParams.get(BrowserQueryParam.ReturnTo);
    if (returnTo) {
      next.searchParams.set(BrowserQueryParam.ReturnTo, returnTo);
    }
  }
  next.searchParams.set(BrowserQueryParam.Refresh, 'true');
  next.searchParams.delete('flow');
  return next.toString();
}

/**
 * Handle error on Login and Registration flow
 *
 *
 * @param flow$
 * @returns flow$ with a catchError pipe
 *
 * @exports
 */
export function LoginRegisterFlowErrorHandler(
  flow$: Observable<LoginFlow | RegistrationFlow>
): Observable<LoginFlow | RegistrationFlow | null> {
  return flow$.pipe(
    catchError((err: HttpErrorResponse) => {
      const genError = err.error?.error as GenericError | undefined;

      if (!genError) {
        // Bad response (unparsable body) or no response at all (network error, server down, ...).
        console.log('Unhandled flow error, no error body', err);
        return of(null);
      }

      console.log(genError, genError.code, genError.id);

      switch (genError.code) {
        case 400:
          if (genError.id === ErrorEnum.SessionAlreadyAvailable) {
            // Kratos already has a session. Sign in to the API with that cookie
            // and enter the app. Emitting nothing keeps the login error UI hidden.
            const returnTo =
              new URLSearchParams(window.location.search).get(BrowserQueryParam.ReturnTo) ||
              window.location.origin;
            return from(kratosApiAuth.exchange(returnTo)).pipe(
              switchMap(() => EMPTY),
              catchError(() => of(null))
            );
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

      return of(null);
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
export function RecoveryFlowErrorHandler(flow$: Observable<RecoveryFlow>): Observable<RecoveryFlow | null> {
  return flow$.pipe(
    catchError((err: HttpErrorResponse) => {
      const genError = err.error?.error as GenericError | undefined;

      if (!genError) {
        // Bad response (unparsable body) or no response at all (network error, server down, ...).
        console.log('Unhandled flow error, no error body', err);
        return of(null);
      }

      console.log(genError, genError.code, genError.id);

      if (isRecoveryBlockedBySession(genError)) {
        const next = urlWithRecoveryRefresh(window.location.href);
        if (next) {
          redirect.to(next);
          return EMPTY;
        }
      }

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

      return of(null);
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
      const genError = err.error?.error as GenericError | undefined;

      console.log(genError, genError?.code, genError?.id);

      if (genError?.code === 401 && genError.id === ErrorEnum.SessionInactive) {
        // No Kratos logout URL is issued for an inactive session, so the
        // browser must open the API logout itself. That response expires the
        // refresh cookie and redirects home. Drop any access token a 401
        // handler may have written back before this runs.
        writeStoredAccessToken(undefined);
        redirectLimit.reset();
        redirect.to(API_LOGOUT_URL);
        return EMPTY;
      }

      console.log('Handle error !');
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
