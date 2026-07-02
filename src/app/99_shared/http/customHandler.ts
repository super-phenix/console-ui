import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, MonoTypeOperatorFunction, of, pipe, take } from 'rxjs';

export function defaultOnceHandler<T>(): MonoTypeOperatorFunction<T> {
  return pipe(take(1));
}
export function productOnceHandler<T>(_: MatSnackBar): MonoTypeOperatorFunction<T> {
  return pipe(take(1));
}

// export function productOnceHandler<T>(snackbar: MatSnackBar): MonoTypeOperatorFunction<T> {
//   return pipe(
//     take(1),
//     catchError((err: HttpErrorResponse, _) => {
//       console.error('err', err);
//       if (err.status === HttpStatusCode.NotFound) {
//         let message = DefaultModel.message;

//         if (err?.error?.context?.effectiveId) {
//           message += '\n id=' + err.error.context.effectiveId;
//         }

//         snackbar.open(message, DefaultModel.action, DefaultModel.config);
//       }
//       throw err;
//     })
//   );
// }

export function nonBlockingErrorHandler<T>(): MonoTypeOperatorFunction<T> {
  return pipe(catchError(error => of(error)));
}
