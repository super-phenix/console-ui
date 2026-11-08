const ACCESS_TOKEN_STORAGE_KEY = 'spx.accessToken';

export function readStoredAccessToken(): string | undefined {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
}

export function writeStoredAccessToken(token: string | undefined): void {
  try {
    if (token) {
      sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage can be blocked. The in-memory token still covers this page.
  }
}
