import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DefaultModel } from '@shared/models/snackbar';
import { catchError } from 'rxjs';

interface ConsoleError {
  message: string;
  context: object;
}

export const errorsInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar = inject(MatSnackBar);

  return next(req).pipe(
    catchError(async err => {
      if (err instanceof HttpErrorResponse) {
        // 401s are handled by authErrorInterceptor (renew/re-login); skip the toast.
        if (err.status === 401) {
          throw err;
        }
        let error = err.error;
        let message = error;
        if (typeof error !== 'string') {
          error = error as ConsoleError;
          message = error.message || DefaultModel.message;

          if (error.context && Object.keys(error.context).length > 0) {
            message += '\n Context:';
            for (const [key, value] of Object.entries(error.context)) {
              message += `\n\t ${key}: ${value}`;
            }
          }
        }

        snackbar.open(message, DefaultModel.action, DefaultModel.config);
      }

      throw err;
    })
  );
};
