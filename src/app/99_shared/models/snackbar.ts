import { MatSnackBarConfig } from '@angular/material/snack-bar';

export interface SnackbarModel {
  message: string;
  action?: string;
  config?: MatSnackBarConfig;
}

export const ForbiddenSnackbar: SnackbarModel = {
  message: "Access denied, you do not have the required permissions!",
  action: 'Close',
  config: {
    horizontalPosition: 'end',
    duration: 3000,
    panelClass: ['snackbar', 'snackbar--multiline'],
  },
};

export const UnauthorizedSnackbar: SnackbarModel = {
  message: 'Your session has expired.',
  action: 'Close',
  config: {
    horizontalPosition: 'end',
    duration: 3000,
    panelClass: ['snackbar', 'snackbar--multiline'],
  },
};

export const BadRequestSnackbar: SnackbarModel = {
  message: 'The submitted form is invalid, please check your input.',
  action: 'Close',
  config: {
    horizontalPosition: 'end',
    duration: 3000,
    panelClass: ['snackbar', 'snackbar--multiline'],
  },
};

export const InternalServerErrorSnackbar: SnackbarModel = {
  message: 'Server error during the request.',
  action: 'Close',
  config: {
    horizontalPosition: 'end',
    duration: 3000,
    panelClass: ['snackbar', 'snackbar--multiline'],
  },
};

export const DefaultModel: SnackbarModel = {
  message: 'Error',
  action: 'Close',
  config: {
    horizontalPosition: 'right',
    verticalPosition: 'bottom',
    duration: 10000,
    panelClass: ['snackbar', 'snackbar--multiline'],
  },
};
