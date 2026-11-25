import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NoAccessibleProjectSnackbar } from '../models/snackbar';
import { PermissionService } from '../services/permission.service';
import { StateService } from '../services/state.service';

/** Sends back to the dashboard when the organization has no accessible project. */
export const projectGuard: CanActivateFn = async () => {
  const permission = inject(PermissionService);
  const stateSvc = inject(StateService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  // The permissions are loaded after the organization and its project; on timeout `permissionGuard` decides.
  await firstValueFrom(permission.isReady).catch(() => undefined);
  if (!stateSvc.noProject()) {
    return true;
  }

  snackBar.open(
    NoAccessibleProjectSnackbar.message,
    NoAccessibleProjectSnackbar.action,
    NoAccessibleProjectSnackbar.config
  );
  return router.createUrlTree(['/dashboard']);
};
