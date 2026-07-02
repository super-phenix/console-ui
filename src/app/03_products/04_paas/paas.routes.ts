import { Routes } from '@angular/router';
import { permissionGuard } from '@shared/guard/permission.guard';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';

export const PaasRoutes: Routes = [
  {
    path: 'kaas',
    canActivate: [permissionGuard],
    data: {
      permission: PermissionsEnum.ProjectKaaSRead,
    },
    loadChildren: () => [
      { path: '', loadComponent: () => import('./01_kaas/kaas-list/kaas-list.component').then(m => m.KaasListComponent) },
      { path: 'create', loadComponent: () => import('./01_kaas/kaas-create/kaas-create.component').then(m => m.KaasCreateComponent) },
      { path: 'details/:az/:id', loadComponent: () => import('./01_kaas/kaas-details/kaas-details.component').then(m => m.KaasDetailsComponent) },
      { path: 'update/:az/:id', loadComponent: () => import('./01_kaas/kaas-update/kaas-update.component').then(m => m.KaasUpdateComponent) },
    ],
  },
];
