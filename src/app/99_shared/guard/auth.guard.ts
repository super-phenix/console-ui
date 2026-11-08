import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { kratosApiAuth } from '@kratos-pages/shared/utils/kratos-api-auth';
import { AuthService } from '../services/auth.service';
import { redirectLimit } from '../utils/redirect-limit';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const navigatingTo = window.location.origin + state.url;

  // Refresh Access Token before authentication
  try {
    await auth.getAccessToken();
  } catch {
    return loginOrExchange(navigatingTo);
  }

  if (auth.userLoggedIn()) {
    redirectLimit.reset();
    return true;
  }
  return loginOrExchange(navigatingTo);

  async function loginOrExchange(returnTo: string) {
    if (await kratosApiAuth.exchangeIfSession(returnTo)) {
      return false;
    }
    return router.createUrlTree(['/auth', 'login'], { queryParams: { return_to: returnTo } });
  }
};
