import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const navigatingTo = window.location.origin + state.url;

  // Refresh Access Token before authentication
  try {
    await auth.getAccessToken();
  } catch {
    return router.createUrlTree(['/auth', 'login'], { queryParams: { return_to: navigatingTo } });
  }

  if (auth.userLoggedIn()) {
    return true;
  } else {
    return router.createUrlTree(['/auth', 'login']);
  }
};
