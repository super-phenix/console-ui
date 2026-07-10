# Development Practices

## Standalone Components

The project exclusively uses **standalone components** (Angular v17+). Every component, directive, and pipe is declared as standalone — **do not create NgModules**.

```typescript
@Component({
  selector: 'spx-my-component',
  imports: [CommonModule, MatButtonModule],
  templateUrl: './my-component.component.html',
})
export class MyComponent {}
```

## Zoneless Change Detection

The application runs **without Zone.js** using `provideZonelessChangeDetection()`. This means:

- Angular does not automatically detect changes from async operations.
- You **must** use **Signals** or explicitly mark views for check to trigger change detection.
- All components should use `ChangeDetectionStrategy.OnPush`.

## Signals

Angular **Signals** are the preferred mechanism for state management:

- Use `signal()` for local component state.
- Use `computed()` for derived state.
- Use `effect()` sparingly for side effects.
- Prefer `input()` / `input.required()` over `@Input()`.
- Prefer `output()` over `@Output()`.

Existing code may still use classic patterns (e.g., `BehaviorSubject`, `@Input()`) — migrate when touching it.

## Modern Control Flow

Use Angular's built-in control flow syntax in templates:

- `@if` / `@else` instead of `*ngIf`.
- `@for` (with mandatory `track`) instead of `*ngFor`.
- `@switch` / `@case` instead of `ngSwitch`.

## File Naming Conventions

| Type         | Pattern                                                    |
| ------------ | ---------------------------------------------------------- |
| Components   | `my-component.component.ts`                                |
| Services     | `my-service.service.ts`                                    |
| Guards       | `my-guard.guard.ts`                                        |
| Interceptors | `my-interceptor.interceptor.ts`                            |
| Models       | `my-model.model.ts` or `my-model.interface.ts`             |
| Spec files   | `my-component.component.spec.ts` (next to the source file) |

## Linting

The project uses **ESLint** with the flat config format (`eslint.config.js`):

| Plugin              | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `@eslint/js`        | Core JavaScript rules.                               |
| `typescript-eslint` | TypeScript recommended + stylistic rules.            |
| `angular-eslint`    | Angular-specific rules + inline template processing. |

Key rules:

| Rule                                     | Setting                                         |
| ---------------------------------------- | ----------------------------------------------- |
| `@angular-eslint/component-selector`     | Must be `spx-` prefixed, kebab-case element     |
| `@angular-eslint/directive-selector`     | Must be `spx` prefixed, camelCase attribute     |
| `@angular-eslint/component-class-suffix` | Allowed suffixes: `Component`, `Dialog`, `Base` |
| `@typescript-eslint/no-unused-vars`      | Error (ignores args prefixed with `_`)          |
| `no-unused-private-class-members`        | Error                                           |

**Prettier** is available for code formatting. Ensure your editor uses the project's Prettier settings.

## Testing

- **Framework:** Jasmine with Karma (`@angular/build:karma`).
- **Spec file location:** Next to the file under test.
- Cover both **positive and negative** cases.
- When modifying environment-dependent behavior, test with different environment configurations.
- All tests must pass before submitting a PR.

## Type Safety

Strict TypeScript is enforced (`tsconfig.json` strict mode):

- No implicit `any`.
- Strict null checks.
- Strict property initialization.

Avoid `any` types — use proper interfaces and type definitions.
