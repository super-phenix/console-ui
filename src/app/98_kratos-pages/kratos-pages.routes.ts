import { Routes } from '@angular/router';
import { LoginComponent } from '@kratos-pages/components/login/login.component';
import { NotFoundComponent } from '@kratos-pages/components/not-found/not-found.component';
import { RegistrationComponent } from '@kratos-pages/components/registration/registration.component';
import { ErrorComponent } from '@kratos-pages/components/error/error.component';
import { LogoutComponent } from '@kratos-pages/components/logout/logout.component';
import { SettingsComponent } from '@kratos-pages/components/settings/settings.component';
import { RecoveryComponent } from '@kratos-pages/components/recovery/recovery.component';
import { VerificationComponent } from '@kratos-pages/components/verification/verification.component';

export const KratosPagesRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Sign in',
  },
  {
    path: 'registration',
    component: RegistrationComponent,
    title: 'Sign up',
  },
  {
    path: 'recovery',
    component: RecoveryComponent,
    title: 'Forgot password',
  },
  {
    path: 'logout',
    component: LogoutComponent,
    title: 'Logout',
  },
  {
    path: 'settings',
    component: SettingsComponent,
    title: 'Account settings',
  },
  {
    path: 'verification',
    component: VerificationComponent,
    title: 'Verification',
  },
  {
    path: 'error',
    component: ErrorComponent,
    title: 'Error',
  },
  { path: 'not-found', component: NotFoundComponent, title: 'Not Found' },
];
