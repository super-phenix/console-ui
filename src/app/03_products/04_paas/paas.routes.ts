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
  {
    path: 'dbaas',
    canActivate: [permissionGuard],
    data: {
      permission: PermissionsEnum.ProjectDBaaSRead,
    },
    loadChildren: () => [
      { path: '', loadComponent: () => import('./02_dbaas/dbaas-list/dbaas-list.component').then(m => m.DBaaSListComponent) },
      {
        path: 'create',
        canActivate: [permissionGuard],
        data: { permission: PermissionsEnum.ProjectDBaaSWrite },
        loadComponent: () => import('./02_dbaas/dbaas-create/dbaas-create.component').then(m => m.DBaaSCreateComponent),
      },
      { path: 'details/:az/:id', loadComponent: () => import('./02_dbaas/dbaas-details/dbaas-details.component').then(m => m.DBaaSDetailsComponent) },
      {
        path: 'update/:az/:id',
        canActivate: [permissionGuard],
        data: { permission: PermissionsEnum.ProjectDBaaSWrite },
        loadComponent: () => import('./02_dbaas/dbaas-update/dbaas-update.component').then(m => m.DBaaSUpdateComponent),
      },
    ],
  },
];
