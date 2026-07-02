import { Routes } from '@angular/router';
import { authGuard } from '@shared/guard/auth.guard';
import { permissionGuard } from '@shared/guard/permission.guard';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./00_public/redirect/redirect.component').then(m => m.RedirectComponent) },
  { path: 'callback', loadComponent: () => import('./00_public/callback/callback.component').then(m => m.CallbackComponent) },
  { path: 'auth-complete', loadComponent: () => import('./00_public/auth-complete/auth-complete.component').then(m => m.AuthCompleteComponent) },
  { path: 'inactive-account', loadComponent: () => import('./00_public/inactive-account/inactive-account.component').then(m => m.InactiveAccountComponent) },
  { path: 'terminal/:orgId/:projectId/:az/:productId', loadComponent: () => import('./03_products/01_compute/01_instance/terminal/terminal.component').then(m => m.TerminalComponent) },
  { path: 'vnc/:orgId/:projectId/:az/:productId', loadComponent: () => import('./03_products/01_compute/01_instance/vnc/vnc.component').then(m => m.VNCComponent) },
  { path: 'redirect/:orgId/:projectId/:az/:productType/:productId', loadComponent: () => import('./00_public/redirect/redirect.component').then(m => m.RedirectComponent) },
  {
    path: '',
    loadComponent: () => import('./01_common/main/main.component').then(m => m.MainComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./02_dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'user', children: [{ path: 'details', loadComponent: () => import('./04_user/user-details/user-details.component').then(m => m.UserDetailsComponent) }] },
      {
        path: 'organization',
        children: [
          {
            path: 'settings',
            loadComponent: () => import('./05_organization/organization-settings/organization-settings.component').then(m => m.OrganizationSettingsComponent),
            canActivate: [permissionGuard],
            data: {
              permission: PermissionsEnum.OrganizationRead,
            },
          },
        ],
      },
      {
        path: 'products',
        children: [
          { path: 'compute', loadChildren: () => import('./03_products/01_compute/compute.routes').then(m => m.ComputeRoutes) },
          { path: 'storage', loadChildren: () => import('./03_products/02_storage/storage.routes').then(m => m.StorageRoutes) },
          { path: 'network', loadChildren: () => import('./03_products/03_network/network.routes').then(m => m.NetworkRoutes) },
          { path: 'paas', loadChildren: () => import('./03_products/04_paas/paas.routes').then(m => m.PaasRoutes) },
          { path: 'uncategorized', loadChildren: () => import('./03_products/99_uncategorized/uncategorized.routes').then(m => m.UncategorizedRoutes) },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
