import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@env/environment';
import { from, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip the session endpoint itself to avoid a renewal loop.
  if (req.url === `${environment.session.token}`) {
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
