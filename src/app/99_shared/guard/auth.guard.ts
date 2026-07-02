import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);

  const navigatingTo = window.location.origin + state.url;

  // Refresh Access Token before authentication
  try {
    await auth.getAccessToken();
  } catch {
    auth.redirectToFlow('login', navigatingTo);
  }

  if (auth.userLoggedIn()) {
    return true;
  } else {
    auth.redirectToFlow('login');
    return false;
  }
};
