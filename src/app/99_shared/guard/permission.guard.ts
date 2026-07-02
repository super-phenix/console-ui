import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivateFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ForbiddenSnackbar } from '../models/snackbar';
import { PermissionService } from '../services/permission.service';

export const permissionGuard: CanActivateFn = async (_route, _state) => {
  const permission = inject(PermissionService);
  const snackBar = inject(MatSnackBar);

  return firstValueFrom(permission.isReady)
    .then(res => {
      if (res && permission.canAccess(_route.data['permission'])) {
        return true;
      } else {
        snackBar.open(ForbiddenSnackbar.message, ForbiddenSnackbar.action, ForbiddenSnackbar.config);
        return false;
      }
    })
    .catch(() => {
      console.log('failed to load permissions from server');
      snackBar.open(ForbiddenSnackbar.message, ForbiddenSnackbar.action, ForbiddenSnackbar.config);
      return false;
    });
};
