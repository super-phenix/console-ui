import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

// Channel/key shared with SessionRecoveryService in the main tab.
const AUTH_CHANNEL = 'spx-auth';
const AUTH_DONE = 'done';

/**
 * Landing page for the re-login tab. Once the session is re-established it pings
 * the main tab (which renews and replays the pending request) then closes itself.
 *
 * The ping uses BroadcastChannel + a localStorage fallback, both origin-scoped, so
 * it works regardless of window.opener (cross-origin login hops can sever opener).
 * Auto-close often fails for the same reason, so we expose a button: a user-gesture
 * close is far more reliable.
 */
@Component({
  selector: 'spx-auth-complete',
  imports: [MatButtonModule],
  template: `
    <div class="auth-complete d-flex flex-column align-items-center justify-content-center gap-3">
      <h2>Login successful.</h2>
      <span>You can close this tab.</span>
      <button matButton="filled" (click)="closeTab()">Close this tab</button>
    </div>
  `,
})
export class AuthCompleteComponent {
  constructor() {
    this.signalMainTab();
    this.closeTab();
  }

  protected closeTab() {
    window.close();
  }

  // Ping the main tab that re-login is complete.
  private signalMainTab() {
    try {
      const channel = new BroadcastChannel(AUTH_CHANNEL);
      channel.postMessage(AUTH_DONE);
      channel.close();
    } catch {
      console.error('Unable to broadcast on authentication channel');
    }
    // storage-event fallback fires in the main tab (changed value required).
    try {
      localStorage.setItem(AUTH_CHANNEL, String(Date.now()));
    } catch {
      console.error('Unable to save in local storage authentication change');
    }
  }
}
