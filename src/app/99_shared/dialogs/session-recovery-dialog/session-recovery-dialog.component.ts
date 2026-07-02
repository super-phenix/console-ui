import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';

// Two-state dialog for the re-login flow. The "Log in" button does not close the
// dialog; it flips to the waiting state and lets SessionRecoveryService close it
// once the login tab signals completion and the token is renewed.
@Component({
  selector: 'spx-session-recovery-dialog',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule, MatDialogTitle, MatDialogContent, MatDialogActions],
  template: `
    <h2 mat-dialog-title>Session expired</h2>
    <div mat-dialog-content class="session-recovery-dialog d-flex flex-column">
      @if (waiting()) {
        <div class="d-flex align-items-center gap-3">
          <mat-progress-spinner mode="indeterminate" diameter="24" />
          <span>Waiting for you to finish logging in in the other tab…</span>
        </div>
      } @else {
        <span>Your session has expired. Please log in again.</span>
      }
    </div>

    @if (!waiting()) {
      <mat-dialog-actions align="end">
        <button matButton="outlined" (click)="cancel()">Cancel</button>
        <button matButton="filled" (click)="confirm()">Log in</button>
      </mat-dialog-actions>
    }
  `,
  styles: `
    .session-recovery-dialog {
      padding-block: 0.75rem;
      min-width: 300px;
    }
  `,
})
export class SessionRecoveryDialog {
  readonly dialogRef = inject(MatDialogRef<SessionRecoveryDialog>);

  // Fired when the user asks to log in; the service then opens the login tab.
  // A Subject (not output()) because the dialog is driven programmatically.
  readonly login = new Subject<void>();

  readonly waiting = signal(false);

  confirm() {
    this.waiting.set(true);
    this.login.next();
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
