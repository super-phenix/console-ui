import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@env/environment';

/**
 * Adds `withCredentials: true` to all requests targeting the Kratos auth URL
 * so that session cookies are sent cross-origin.
 */
export const kratosCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.authUrl)) {
    return next(req.clone({ withCredentials: true }));
  }
  return next(req);
};
