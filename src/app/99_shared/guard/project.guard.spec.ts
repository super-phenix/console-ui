import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { NoAccessibleProjectSnackbar } from '../models/snackbar';
import { PermissionService } from '../services/permission.service';
import { StateService } from '../services/state.service';
import { projectGuard } from './project.guard';

describe('projectGuard', () => {
  const noProject = signal(false);
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const navigate = async (isReady: Observable<boolean>) => {
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'products', canActivate: [projectGuard], children: [] },
          { path: 'dashboard', children: [] },
        ]),
        { provide: PermissionService, useValue: { isReady } },
        { provide: StateService, useValue: { noProject } },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    await RouterTestingHarness.create();
    return TestBed.inject(Router).navigateByUrl('/products');
  };

  beforeEach(() => noProject.set(false));

  it('should let in with a project', async () => {
    await navigate(of(true));

    expect(TestBed.inject(Router).url).toBe('/products');
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('should show an error and open the dashboard without project', async () => {
    noProject.set(true);
    await navigate(of(true));

    expect(TestBed.inject(Router).url).toBe('/dashboard');
    expect(snackBar.open).toHaveBeenCalledOnceWith(
      NoAccessibleProjectSnackbar.message,
      NoAccessibleProjectSnackbar.action,
      NoAccessibleProjectSnackbar.config
    );
  });

  it('should wait for the state to be loaded', async () => {
    const ready = new Subject<boolean>();
    const navigation = navigate(ready);
    await new Promise(resolve => setTimeout(resolve));
    noProject.set(true);
    ready.next(true);
    await navigation;

    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('should leave the decision to the permission guard when the state is not loaded in time', async () => {
    await navigate(throwError(() => new Error('timeout')));

    expect(TestBed.inject(Router).url).toBe('/products');
  });
});
