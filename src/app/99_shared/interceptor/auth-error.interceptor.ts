import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { UnauthorizedSnackbar } from '../models/snackbar';
import { AuthService, SESSION_TOKEN_URL } from '../services/auth.service';
import { SessionRecoveryService } from '../services/session-recovery.service';

// Last-resort net for 401s the pre-send check can't predict (server-side
// invalidation, clock skew, a request already in flight at expiry). Renews once
// and replays; if the session is fully gone, drives the re-login flow.
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const recovery = inject(SessionRecoveryService);
  const snackbar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((err: unknown) => {
      const isSessionEndpoint = req.url === SESSION_TOKEN_URL;
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || isSessionEndpoint) {
        return throwError(() => err);
      }

      return from(recover()).pipe(
        // Only the recovery itself is caught here; the replayed request errors
        // propagate normally (placed before switchMap).
        catchError((recoverErr: unknown) => {
          snackbar.open(UnauthorizedSnackbar.message, UnauthorizedSnackbar.action, UnauthorizedSnackbar.config);
          return throwError(() => recoverErr);
        }),
        switchMap(() =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${auth.accessToken()}` } }))
        )
      );
    })
  );

  // Silent renewal first; if the session is fully expired, fall back to re-login.
  async function recover(): Promise<void> {
    try {
      await auth.renewAccessToken();
    } catch {
      await recovery.recover();
    }
  }
};
