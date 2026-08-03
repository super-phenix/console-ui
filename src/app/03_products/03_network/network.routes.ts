import { Routes } from '@angular/router';
import { permissionGuard } from '@shared/guard/permission.guard';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';

export const NetworkRoutes: Routes = [
  {
    path: 'vpc',
    canActivate: [permissionGuard],
    data: {
      permission: PermissionsEnum.ProjectVPCRead,
    },
    loadChildren: () => [
      { path: '', loadComponent: () => import('./02_vpc/vpc-list/vpc-list.component').then(m => m.VpcListComponent) },
      { path: 'create', loadComponent: () => import('./02_vpc/vpc-create/vpc-create.component').then(m => m.VpcCreateComponent) },
      { path: 'details/:az/:id', loadComponent: () => import('./02_vpc/vpc-details/vpc-details.component').then(m => m.VpcDetailsComponent) },
      { path: 'update/:az/:id', loadComponent: () => import('./02_vpc/vpc-update/vpc-update.component').then(m => m.VpcUpdateComponent) },
    ],
  },
  {
    path: 'subnet',
    canActivate: [permissionGuard],
    data: {
      permission: PermissionsEnum.ProjectSubnetRead,
    },
    loadChildren: () => [
      { path: '', loadComponent: () => import('./01_subnet/subnet-list/subnet-list.component').then(m => m.SubnetListComponent) },
      { path: 'create', loadComponent: () => import('./01_subnet/subnet-create/subnet-create.component').then(m => m.SubnetCreateComponent) },
      { path: 'details/:az/:id', loadComponent: () => import('./01_subnet/subnet-details/subnet-details.component').then(m => m.SubnetDetailsComponent) },
      { path: 'update/:az/:id', loadComponent: () => import('./01_subnet/subnet-update/subnet-update.component').then(m => m.SubnetUpdateComponent) },
    ],
  },
  {
    path: 'eip',
    canActivate: [permissionGuard],
    data: {
      permission: PermissionsEnum.ProjectEipRead,
    },
    loadChildren: () => [
      { path: '', loadComponent: () => import('./03_eip/eip-list/eip-list.component').then(m => m.EipListComponent) },
      { path: 'create', loadComponent: () => import('./03_eip/eip-create/eip-create.component').then(m => m.EipCreateComponent) },
      { path: 'details/:az/:id', loadComponent: () => import('./03_eip/eip-details/eip-details.component').then(m => m.EipDetailsComponent) },
      { path: 'update/:az/:id', loadComponent: () => import('./03_eip/eip-update/eip-update.component').then(m => m.EipUpdateComponent) },
    ],
  },
  {
    path: 'load-balancer',
    canActivate: [permissionGuard],
    data: {
      permission: PermissionsEnum.ProjectLoadBalancerRead,
    },
    loadChildren: () => [
      { path: '', loadComponent: () => import('./04_load_balancer/load-balancer-list/load-balancer-list.component').then(m => m.LoadBalancerListComponent) },
      { path: 'create', loadComponent: () => import('./04_load_balancer/load-balancer-create/load-balancer-create.component').then(m => m.LoadBalancerCreateComponent) },
      { path: 'details/:az/:id', loadComponent: () => import('./04_load_balancer/load-balancer-details/load-balancer-details.component').then(m => m.LoadBalancerDetailsComponent) },
      { path: 'update/:az/:id', loadComponent: () => import('./04_load_balancer/load-balancer-update/load-balancer-update.component').then(m => m.LoadBalancerUpdateComponent) },
    ],
  },
  {
    path: 'security-group',
    canActivate: [permissionGuard],
    data: {
      permission: PermissionsEnum.ProjectSecurityGroupRead,
    },
    loadChildren: () => [
      { path: '', loadComponent: () => import('./05_security_group/security-group-list/security-group-list.component').then(m => m.SecurityGroupListComponent) },
      { path: 'create', loadComponent: () => import('./05_security_group/security-group-create/security-group-create.component').then(m => m.SecurityGroupCreateComponent) },
      { path: 'details/:az/:id', loadComponent: () => import('./05_security_group/security-group-details/security-group-details.component').then(m => m.SecurityGroupDetailsComponent) },
      { path: 'update/:az/:id', loadComponent: () => import('./05_security_group/security-group-update/security-group-update.component').then(m => m.SecurityGroupUpdateComponent) },
    ],
  },
  {
    // Legacy path: the product was renamed from "firewall" to "security-group".
    // Kept so bookmarks and links predating the rename keep resolving.
    path: 'firewall',
    children: [
      {
        path: '**',
        redirectTo: ({ url }) => {
          const rest = url.map(s => s.path).join('/');
          return rest ? `/products/network/security-group/${rest}` : '/products/network/security-group';
        },
      },
    ],
  },
];
