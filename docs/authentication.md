# Authentication & Session

The app uses a **cookie-based session** with **JWT access tokens**.

## Flow Overview

```
1. Initial login
   Browser → auth-ui (/ui/login) → redirect back to /auth-complete
   /auth-complete page signals the main tab via BroadcastChannel

2. Session bootstrap
   AuthService.getAccessToken()
     → GET /v1/session (with cookie)
     ← { session: "<JWT>", user: {...} }
     → stores JWT in a signal, sets user, calls StateService.onLogin()

3. Ongoing requests (interceptor chain)
   tokenInterceptor
     → checks token expiry, renews if < autoRenew minutes left
     → attaches Authorization: Bearer <JWT> header
   authErrorInterceptor
     → catches 401 responses
     → tries silent renewal (renewAccessToken)
     → if renewal fails, opens SessionRecoveryService
   errorsInterceptor
     → catches non-401 HTTP errors
     → displays error message in a snackbar

4. Session recovery (fully expired)
   SessionRecoveryService.recover()
     → opens a dialog asking the user to log in again
     → opens auth-ui in a new tab
     → waits for BroadcastChannel signal from /auth-complete
     → renews the token and replays the failed request
```

## Key Files

| File                                              | Role                                                       |
| ------------------------------------------------- | ---------------------------------------------------------- |
| `99_shared/services/auth.service.ts`              | Token storage (signal), login/logout redirects, renewal    |
| `99_shared/services/session-recovery.service.ts`  | Re-login dialog + popup flow when session is fully expired |
| `99_shared/interceptor/token.interceptor.ts`      | Attaches JWT, pre-emptive renewal before expiry            |
| `99_shared/interceptor/auth-error.interceptor.ts` | Catches 401s, triggers renewal or recovery                 |
| `99_shared/interceptor/errors.interceptor.ts`     | Catches non-401 errors, shows snackbar                     |
| `99_shared/guard/auth.guard.ts`                   | Blocks routes until session is established                 |
| `00_public/auth-complete/`                        | Worker page that signals the main tab after login          |

## Interceptor Registration Order

Interceptors are registered in `app.config.ts`:

```typescript
provideHttpClient(
  withInterceptors([
    tokenInterceptor,     // 1. Attach token + pre-emptive renewal
    authErrorInterceptor, // 2. Handle 401 responses
    errorsInterceptor,    // 3. Handle all other HTTP errors
  ])
);
```
