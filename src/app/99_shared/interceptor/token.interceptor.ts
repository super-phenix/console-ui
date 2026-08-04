import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService, SESSION_TOKEN_URL } from '../services/auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip the session endpoint itself to avoid a renewal loop.
  if (req.url === SESSION_TOKEN_URL) {
    return next(req);
  }

  const auth = inject(AuthService);
  if (!auth.userLoggedIn()) {
    return next(req);
  }

  // Renew before sending if the token is missing or near expiry. On failure
  // proceed anyway; the 401 handler recovers (renew or re-login + replay).
  return from(auth.ensureValidToken().catch(() => undefined)).pipe(
    switchMap(() =>
      next(
        req.clone({
          setHeaders: {
            Authorization: `Bearer ${auth.accessToken()}`,
          },
        })
      )
    )
  );
};
