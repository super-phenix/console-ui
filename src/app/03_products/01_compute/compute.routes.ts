import { Routes } from '@angular/router';
import { permissionGuard } from '@shared/guard/permission.guard';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';

export const ComputeRoutes: Routes = [
  {
    path: 'instance',
    canActivate: [permissionGuard],
    data: {
      permission: PermissionsEnum.ProjectInstanceRead,
    },
    loadChildren: () => [
      { path: '', loadComponent: () => import('./01_instance/instance-list/instance-list.component').then(m => m.InstanceListComponent) },
      { path: 'create', loadComponent: () => import('./01_instance/instance-create/instance-create.component').then(m => m.InstanceCreateComponent) },
      { path: 'details/:az/:id', loadComponent: () => import('./01_instance/instance-details/instance-details.component').then(m => m.InstanceDetailsComponent) },
      { path: 'update/:az/:id', loadComponent: () => import('./01_instance/instance-update/instance-update.component').then(m => m.InstanceUpdateComponent) },
    ],
  },
  {
    path: 'instance-snapshot',
    canActivate: [permissionGuard],
    data: {
      permission: PermissionsEnum.ProjectSnapshotRead,
    },
    children: [
      { path: '', loadComponent: () => import('./02_instance_snapshot/instance-snapshot-list/instance-snapshot-list.component').then(m => m.InstanceSnapshotListComponent) },
      { path: 'details/:az/:id', loadComponent: () => import('./02_instance_snapshot/instance-snapshot-details/instance-snapshot-details.component').then(m => m.InstanceSnapshotDetailsComponent) },
    ],
  },
];
