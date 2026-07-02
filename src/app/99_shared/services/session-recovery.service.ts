import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, map, race } from 'rxjs';
import { SessionRecoveryDialog } from '../dialogs/session-recovery-dialog/session-recovery-dialog.component';
import { AuthService } from './auth.service';

// Channel/key shared with the auth-complete worker page in the login tab.
const AUTH_CHANNEL = 'spx-auth';
const AUTH_DONE = 'done';

// Give up waiting for the login tab after this long so the main tab never hangs.
const RECOVERY_TIMEOUT_MS = 5 * 60 * 1000;
// How often we check whether the user closed the login tab without finishing.
const POPUP_POLL_MS = 500;

/**
 * Orchestrates re-login when the session is fully expired (refresh cookie dead).
 * Pops a dialog, opens the login flow in a new tab, waits for it to ping back,
 * then renews the access token so the caller can replay its request. The dialog
 * stays open (waiting state) until renewal completes or recovery fails.
 */
@Injectable({ providedIn: 'root' })
export class SessionRecoveryService {
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);

  // Single-flight so concurrent 401s share one dialog and one re-login.
  private recoverInFlight: Promise<void> | null = null;

  recover(): Promise<void> {
    if (!this.recoverInFlight) {
      this.recoverInFlight = this.runRecovery().finally(() => (this.recoverInFlight = null));
    }
    return this.recoverInFlight;
  }

  private async runRecovery(): Promise<void> {
    const dialogRef = this.dialog.open(SessionRecoveryDialog, { disableClose: true });

    try {
      // Resolve true on "Log in", false on cancel (dialog closed without confirming).
      const confirmed = await firstValueFrom(
        race(
          dialogRef.componentInstance.login.pipe(map(() => true)),
          dialogRef.afterClosed().pipe(map(() => false))
        )
      );

      if (!confirmed) {
        throw new Error('login cancelled');
      }

      const popup = this.auth.openLoginPopup('/auth-complete');
      if (!popup) {
        // Popup blocked: fall back to a full-page redirect. The page navigates away,
        // so this promise never resolves and the pending request is abandoned.
        this.auth.redirectToFlow('login', location.href);
        await new Promise<never>(() => {
          /* page is navigating away */
        });
      }

      await this.waitForAuthComplete(popup);
      await this.auth.renewAccessToken();
    } finally {
      dialogRef.close();
    }
  }

  // Resolve when the login tab signals completion, via BroadcastChannel with a
  // storage-event fallback. Reject if the login tab is closed without finishing
  // or the wait times out, so the caller fails fast instead of hanging.
  private waitForAuthComplete(popup: Window | null): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const channel = new BroadcastChannel(AUTH_CHANNEL);

      const onStorage = (event: StorageEvent) => {
        if (event.key === AUTH_CHANNEL && event.newValue) {
          done();
        }
      };

      const timeout = setTimeout(() => fail(new Error('login timed out')), RECOVERY_TIMEOUT_MS);
      const poll = setInterval(() => {
        if (popup?.closed) {
          fail(new Error('login tab closed'));
        }
      }, POPUP_POLL_MS);

      const cleanup = () => {
        channel.close();
        window.removeEventListener('storage', onStorage);
        clearTimeout(timeout);
        clearInterval(poll);
      };
      const done = () => {
        cleanup();
        resolve();
      };
      const fail = (err: Error) => {
        cleanup();
        reject(err);
      };

      channel.onmessage = event => {
        if (event.data === AUTH_DONE) {
          done();
        }
      };
      window.addEventListener('storage', onStorage);
    });
  }
}
