import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';

/**
 * MatSnackBar override providing a default dismiss action ("✕") so every
 * toast in the app can be closed manually instead of waiting for its duration to elapse.
 */
@Injectable({ providedIn: 'root' })
export class AppSnackBar extends MatSnackBar {
  override open(message: string, action = '✕', config?: MatSnackBarConfig): MatSnackBarRef<SimpleSnackBar> {
    return super.open(message, action, config);
  }
}
