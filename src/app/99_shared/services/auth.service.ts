import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal, WritableSignal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { API_ENDPOINT, HTTP_PROTOCOL, environment } from '@env/environment';
import { firstValueFrom } from 'rxjs';
import { jwtDecode } from '@shared/http/jwtDecode';
import { Session, User } from '../models/data/user';
import { StateService } from './state.service';

export const SESSION_TOKEN_URL = `${HTTP_PROTOCOL}${environment.apiUrl}${API_ENDPOINT}/session`;
export const SESSION_WHOAMI_URL = `${HTTP_PROTOCOL}${environment.apiUrl}${API_ENDPOINT}/whoami`;

// Minutes left before the access token expires; a stale/undecodable token returns 0.
function getTokenMinutesBeforeExp(token: string): number {
  try {
    const decoded = jwtDecode(token);
    const diff = decoded.exp * 1000 - Date.now();
    return Math.floor(diff / 1000 / 60);
  } catch {
    return 0;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  protected http = inject(HttpClient);
  protected stateSvc = inject(StateService);
  private router = inject(Router);

  private _accessToken: WritableSignal<string | undefined> = signal(undefined);
  accessToken = this._accessToken.asReadonly();

  userLoggedIn = computed(() => {
    return this.accessToken() !== undefined && this.accessToken() !== '';
  });

  user: WritableSignal<User | undefined> = signal(undefined);

  // Shared in-flight renewal so concurrent requests trigger a single /v1/session call.
  private renewInFlight: Promise<string> | null = null;

  /**
   * get access token for the first time by asking to api gateway
   */
  async getAccessToken() {
    if (!this.userLoggedIn()) {
      try {
        const res = await firstValueFrom(
          this.http.get<Session>(SESSION_TOKEN_URL, { withCredentials: true })
        );
        this.user.set(res.user);
        this.setAccessToken(res.session);
        this.stateSvc.onLogin(res.user);
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  }

  /**
   * Renew the access token via the refresh cookie. Single-flight: concurrent
   * callers share one request. Throws if the session can no longer be renewed.
   */
  renewAccessToken(): Promise<string> {
    if (this.renewInFlight) {
      return this.renewInFlight;
    }
    this.renewInFlight = (async () => {
      try {
        const res = await firstValueFrom(
          this.http.get<Session>(SESSION_TOKEN_URL, { withCredentials: true })
        );
        this.user.set(res.user);
        this.setAccessToken(res.session);
        return res.session;
      } finally {
        this.renewInFlight = null;
      }
    })();
    return this.renewInFlight;
  }

  /**
   * Renew the access token before a request when it is missing or about to
   * expire, so the outgoing request carries a valid token.
   */
  async ensureValidToken() {
    const token = this.accessToken();
    if (!token || getTokenMinutesBeforeExp(token) <= environment.sessionAutoRenew) {
      await this.renewAccessToken();
    }
  }

  /**
   * Open the login flow in a new tab, returning to the worker page that
   * pings this tab once the session is re-established. Returns null if blocked.
   */
  openLoginPopup(returnPath: string): Window | null {
    const returnTo = encodeURIComponent(`${window.location.origin}${returnPath}`);
    return window.open(`${window.location.origin}/auth/login?return_to=${returnTo}`, '_blank');
  }

  /**
   * Update access token
   * @param token
   */
  setAccessToken(token: string) {
    this._accessToken.set(token);
  }

  /**
   * Navigate to the internal auth flow page
   * @param flow
   */
  redirectToFlow(flow: 'login' | 'logout' | 'settings', redirect?: string) {
    const returnTo = redirect || location.href;
    this.router.navigate(['/auth', flow], { queryParams: { return_to: returnTo } });
  }

  async reloadUser() {
    const res = await firstValueFrom(this.http.get<User>(SESSION_WHOAMI_URL));
    this.user.set(res);
    this.stateSvc.onLogin(res);
  }
}
