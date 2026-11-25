# Theming, CSS Overrides, and Images

## Theme Architecture

The application's visual identity is defined through a layered theming system built on CSS custom properties and Angular Material's theming API.

### Style Entry Points

The global styles are loaded from `angular.json` in this order:

1. `src/styles/static/xterm.css` — terminal emulator styles.
2. `src/styles/styles.scss` — main stylesheet that imports all other partials.

### Key Style Files

| File                                      | Role                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/styles/styles.scss`                  | Root stylesheet. Imports theme, components, material overrides, utils, grid, and product styles.           |
| `src/styles/theme.scss`                   | Defines fonts, CSS custom properties (color primitives, background/logo images), and applies theme mixins. |
| `src/styles/common/_theme-variables.scss` | Theme variable mixins (`state-color()`, `custom-color()`) consumed by `theme.scss`.                        |
| `src/styles/common/_components.scss`      | Shared component styles.                                                                                   |
| `src/styles/common/_material.scss`        | Angular Material component overrides.                                                                      |
| `src/styles/common/_grid.scss`            | Grid layout utilities.                                                                                     |
| `src/styles/common/_utils.scss`           | General CSS utility classes.                                                                               |
| `src/styles/common/_product.scss`         | Product-specific styles.                                                                                   |
| `src/styles/common/material/`             | Directory containing per-component Material overrides.                                                     |

### Fonts

- **Funnel Display** — headlines and titles (`--headline-font`).
- **Google Sans**, falling back to **Host Grotesk** — body text, labels and UI copy (`--body-font`).
- **JetBrainsMono** — monospace only (code blocks, cloud-init, YAML); referenced directly by a few
  component styles, not through a token.
- **Material Symbols Rounded** — icon font.

## CSS Custom Properties (Design Tokens)

All design tokens are declared as CSS custom properties on the `:root` / `html` selector in `theme.scss`. They are organized into:

- **Primitives** — raw color values (e.g., `--primary-50`, `--neutral-30`, `--red-50`).
- **Semantic tokens** — derived from primitives via theme variable mixins for states (success, error, warning) and custom purposes.

## Theme Override Mechanism

To customize the theme **without editing source files**, use the override system:

1. A template file is provided at `public/styles/theme-override.template.css` with all available tokens commented out.
2. The active override file is `public/styles/theme-override.css`.
3. To customize, uncomment and modify only the variables you need in `theme-override.css`.

> **Important:** Do not edit `src/styles/theme.scss` directly. Always use the override file for customizations.

The template supports `light-dark()` CSS function for automatic light/dark mode handling.

## Images and Branding

Branding assets are stored in `public/assets/images/`:

| File             | Usage                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| `logo-full.svg`   | Application wordmark, referenced via `--logo-image`.                             |
| `auth-visual.svg` | Auth-page illustration, referenced via `--auth-visual-image`.                    |

The panel behind the illustration uses `--auth-visual-background`.

To replace branding images, either:

- Swap the SVG files in `public/assets/images/`, or
- Override `--auth-visual-image`, `--auth-visual-background` and `--logo-image` in `theme-override.css`.

### Logo sizing

Logos are drawn with `background-size: contain`, so they keep their aspect ratio inside their box.
Override these variables in `theme-override.css` to resize the box:

| Variable                                       | Surface                           | Default |
| ---------------------------------------------- | --------------------------------- | ------- |
| `--logo-width` / `--logo-height`           | Header                         | 208×32 |
| `--logo-auth-width` / `--logo-auth-height` | Wordmark above the auth form   | 270×42 |
