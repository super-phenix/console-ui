import { Routes } from '@angular/router';
import { permissionGuard } from '@shared/guard/permission.guard';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';

export const StorageRoutes: Routes = [
  {
    path: 'disk',
    canActivate: [permissionGuard],
    data: {
      permission: PermissionsEnum.ProjectDiskRead,
    },
    loadChildren: () => [
      { path: '', loadComponent: () => import('./01_disk/disk-list/disk-list.component').then(m => m.DiskListComponent) },
      { path: 'create', loadComponent: () => import('./01_disk/disk-create/disk-create.component').then(m => m.DiskCreateComponent) },
      { path: 'details/:az/:id', loadComponent: () => import('./01_disk/disk-details/disk-details.component').then(m => m.DiskDetailsComponent) },
      { path: 'update/:az/:id', loadComponent: () => import('./01_disk/disk-update/disk-update.component').then(m => m.DiskUpdateComponent) },
    ],
  },
  {
    path: 'snapshot',
    canActivate: [permissionGuard],
    data: {
      permission: PermissionsEnum.ProjectSnapshotRead,
    },
    loadChildren: () => [
      { path: '', loadComponent: () => import('./02_snapshot/snapshot-list/snapshot-list.component').then(m => m.SnapshotListComponent) },
      { path: 'create', loadComponent: () => import('./02_snapshot/snapshot-create/snapshot-create.component').then(m => m.SnapshotCreateComponent) },
      { path: 'details/:az/:id', loadComponent: () => import('./02_snapshot/snapshot-details/snapshot-details.component').then(m => m.SnapshotDetailsComponent) },
      { path: 'update/:az/:id', loadComponent: () => import('./02_snapshot/snapshot-update/snapshot-update.component').then(m => m.SnapshotUpdateComponent) },
    ],
  },
  {
    path: 'baas',
    canActivate: [permissionGuard],
    data: {
      permission: PermissionsEnum.ProjectBaaSRead,
    },
    loadChildren: () => [
      { path: '', loadComponent: () => import('./03_baas/baas-list/baas-list.component').then(m => m.BaasListComponent) },
      { path: 'create', loadComponent: () => import('./03_baas/baas-create/baas-create.component').then(m => m.BaasCreateComponent) },
      { path: 'details/:az/:id', loadComponent: () => import('./03_baas/baas-details/baas-details.component').then(m => m.BaasDetailsComponent) },
      { path: 'update/:az/:id', loadComponent: () => import('./03_baas/baas-update/baas-update.component').then(m => m.BaasUpdateComponent) },
    ],
  },
  {
    path: 'bucket',
    canActivate: [permissionGuard],
    data: {
      permission: PermissionsEnum.ProjectBucketRead,
    },
    loadChildren: () => [
      { path: '', loadComponent: () => import('./04_bucket/bucket-list/bucket-list.component').then(m => m.BucketListComponent) },
      {
        path: 'create',
        canActivate: [permissionGuard],
        data: { permission: PermissionsEnum.ProjectBucketWrite },
        loadComponent: () => import('./04_bucket/bucket-create/bucket-create.component').then(m => m.BucketCreateComponent),
      },
      { path: 'details/:az/:id', loadComponent: () => import('./04_bucket/bucket-details/bucket-details.component').then(m => m.BucketDetailsComponent) },
      {
        path: 'update/:az/:id',
        canActivate: [permissionGuard],
        data: { permission: PermissionsEnum.ProjectBucketWrite },
        loadComponent: () => import('./04_bucket/bucket-update/bucket-update.component').then(m => m.BucketUpdateComponent),
      },
    ],
  },
];
