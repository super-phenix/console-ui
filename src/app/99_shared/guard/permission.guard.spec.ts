import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { permissionGuard } from './permission.guard';

describe('permissionGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => permissionGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
