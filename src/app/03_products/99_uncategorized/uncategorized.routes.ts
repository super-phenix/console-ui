import { Routes } from '@angular/router';

export const UncategorizedRoutes: Routes = [
  {
    path: 'ssh',
    loadChildren: () => [
      { path: '', loadComponent: () => import('./01_ssh/ssh-list/ssh-list.component').then(m => m.SshListComponent) },
      { path: 'create', loadComponent: () => import('./01_ssh/ssh-create/ssh-create.component').then(m => m.SshCreateComponent) },
    ],
  },
];
