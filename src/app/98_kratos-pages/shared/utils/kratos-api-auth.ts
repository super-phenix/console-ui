import { API_TOKEN_URL, environment } from '@env/environment';
import { redirectLimit } from '@shared/utils/redirect-limit';

/**
 * Exchange the Kratos session cookie for an API access token.
 */
export const kratosApiAuth = {
  /**
   * When Kratos already has a session, start the API exchange without opening
   * the login screen. Returns false when there is no session.
   */
  async exchangeIfSession(returnTo: string | null): Promise<boolean> {
    try {
      const response = await fetch(`${environment.authUrl}/sessions/whoami`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        return false;
      }
    } catch {
      return false;
    }

    try {
      await this.exchange(returnTo);
    } catch {
      return false;
    }
    return true;
  },

  async exchange(returnTo: string | null): Promise<void> {
    const target = returnTo || window.location.origin;
    const url = `${API_TOKEN_URL}?return_to=${encodeURIComponent(target)}`;
    if (!redirectLimit.once(url)) {
      throw new Error('redirect limit');
    }
  },
};
