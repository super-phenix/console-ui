# Adding a New Product

This guide walks through every step needed to add a new product to the Console UI.

## 1. Create the Model

Add your product interfaces in `src/app/03_products/00_shared/models/<category>/<product>/`.

**Domain model** — describes the API response shape:

```typescript
// my-product.model.ts
import { ObjectMeta } from '../../common.model';

export interface MyProduct {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: MyProductSpec;
  status: MyProductStatus;
}
```

**Creation model** — describes the payload sent when creating the resource:

```typescript
// create-my-product.model.ts
export class CreateMyProduct {
  constructor(init: Partial<CreateMyProduct>) {
    Object.assign(this, init);
  }
  name!: string;
  // ...other fields
}
```

**Register the product type** in `product.model.ts`:

```typescript
// In 00_shared/models/product.model.ts
export interface ProductMyProduct extends Product {
  myProduct?: MyProduct;
}
```

## 2. Create the Service

Add a service file in `src/app/03_products/00_shared/services/my-product.service.ts`.

All product services extend `BaseService<T, K>`, which provides `list()`, `listByAZ()`, `get()`, `create()`, and `delete()` out of the box.

```typescript
import { Injectable } from '@angular/core';
import { ProductMyProduct } from '../models/product.model';
import { CreateMyProduct } from '../models/<category>/my-product/create-my-product.model';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class MyProductService extends BaseService<ProductMyProduct, CreateMyProduct> {
  override ENDPOINT = '/my-product';

  // Add product-specific methods here
}
```

> Don't forget to add a spec file (`my-product.service.spec.ts`) next to the service.

## 3. Create the Components

Add component folders inside the appropriate category directory:

```
src/app/03_products/<NN_category>/<NN_product>/
  my-product-list/
    my-product-list.component.ts
    my-product-list.component.html
    my-product-list.component.scss
    my-product-list.component.spec.ts
  my-product-details/
    ...
  my-product-create/
    ...
```

Follow the existing numbering convention (e.g., `01_instance`, `02_instance_snapshot`). Use the next available number in the category.

All components must be **standalone** and use the `spx` selector prefix.

## 4. Declare the Routes

Add routes in the category's route file (e.g., `compute.routes.ts`, `storage.routes.ts`):

```typescript
// <category>.routes.ts
{
  path: 'my-product',
  canActivate: [permissionGuard],
  data: {
    permission: PermissionsEnum.ProjectMyProductRead,
  },
  loadChildren: () => [
    { path: '', loadComponent: () => import('./<NN_product>/my-product-list/my-product-list.component').then(m => m.MyProductListComponent) },
    { path: 'create', loadComponent: () => import('./<NN_product>/my-product-create/my-product-create.component').then(m => m.MyProductCreateComponent) },
    { path: 'details/:az/:id', loadComponent: () => import('./<NN_product>/my-product-details/my-product-details.component').then(m => m.MyProductDetailsComponent) },
  ],
},
```

If you are creating a **new category**, you also need to:

1. Create a `<category>.routes.ts` file exporting a `Routes` array.
2. Register it in `app.routes.ts` under the `products` children:

```typescript
{ path: 'my-category', loadChildren: () => import('./03_products/<NN_category>/<category>.routes').then(m => m.MyCategoryRoutes) },
```

## 5. Register in the Sidebar

Add the product to the navigation in `src/app/99_shared/models/data/product.enum.ts`:

**Add to an existing category:**

```typescript
export const ProductCompute: ProductCategory = {
  // ...
  items: [
    // ...existing items
    {
      link: 'my-product',
      title: 'My Product',
    },
  ],
};
```

**Add the `ProductTypeLink` mapping** (used for deep-linking from notifications/redirects):

```typescript
export const ProductTypeLink: Map<string, string> = new Map<string, string>([
  // ...existing entries
  ['myProduct', 'my-product'],
]);
```

## 6. Add the Permission (if applicable)

If the product requires a specific permission, add the new entry to `PermissionsEnum` in `src/app/99_shared/models/permissions/permission.enum.ts` and reference it in the route guard's `data.permission`.

## Checklist

- [ ] Model interfaces created in `00_shared/models/<category>/<product>/`
- [ ] Product type added to `product.model.ts`
- [ ] Service extending `BaseService` created in `00_shared/services/`
- [ ] Service spec file created
- [ ] Components created (list, details, create, etc.)
- [ ] Component spec files created
- [ ] Routes declared in category route file
- [ ] Product added to sidebar in `product.enum.ts`
- [ ] `ProductTypeLink` entry added
- [ ] Permission added to `PermissionsEnum` (if needed)
- [ ] All tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
