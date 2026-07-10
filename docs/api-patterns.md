# API Patterns

## BaseService

All product API services extend `BaseService<T, K>` (`03_products/00_shared/services/base.service.ts`). It provides standard CRUD methods and builds URLs from the organisation, project, and availability zone context.

```typescript
@Injectable({ providedIn: 'root' })
export class MyProductService extends BaseService<MyProduct, CreateMyProduct> {
  override ENDPOINT = '/my-product';

  // Inherited: list(), listByAZ(), get(), getByLocalId(), create(), delete()
  // Add product-specific methods here
}
```

## URL Structure

URLs are built by `getPath()` and `getBasePath()`:

```
{http_url}/{orgId}{controller_api}/{az}/{projectId}{ENDPOINT}

Example:
https://api.example.com/org-123/api/spx-ctrl/az-1/proj-456/instance
```

## Custom Handlers

Two RxJS operators are available in `99_shared/http/customHandler.ts`:

| Operator                    | Behavior                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `defaultOnceHandler()`      | `take(1)` — completes after the first emission. Used on all standard API calls.                          |
| `nonBlockingErrorHandler()` | `catchError(() => of(error))` — swallows errors and emits them as values. Use for non-critical requests. |

Always pipe API calls through `defaultOnceHandler()` to ensure observables complete:

```typescript
return this.http.get<T[]>(url).pipe(defaultOnceHandler());
```

## Error Handling

HTTP errors flow through the interceptor chain (see [Authentication — Interceptors](./authentication.md#interceptor-registration-order)):

1. **401 errors** → handled by `authErrorInterceptor` (renewal/recovery), never shown to the user.
2. **All other errors** → caught by `errorsInterceptor`, which displays the error message in a Material snackbar. The error is then re-thrown so the calling code can also react.

The API returns errors as `{ message: string, context: object }`. The interceptor formats the context into the snackbar message.
