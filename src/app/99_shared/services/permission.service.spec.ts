import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';

import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;
  let http: HttpTestingController;
  let readyCount: number;

  const flush = (orgId: string, permissions: string[]) =>
    http.expectOne(req => req.url.includes(`/organization/${orgId}/iam/permissions`)).flush(permissions);

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PermissionService);
    http = TestBed.inject(HttpTestingController);
    readyCount = 0;
  });

  const subscribe = () => {
    const sub = service.isReady.subscribe({ next: () => readyCount++, error: () => undefined });
    return () => sub.unsubscribe();
  };

  it('should be ready once the permissions are loaded', async () => {
    const unsubscribe = subscribe();
    const load = service.loadPermissions('org-a');
    expect(readyCount).toBe(0);

    flush('org-a', [PermissionsEnum.OrganizationRead]);
    await load;

    expect(readyCount).toBe(1);
    expect(service.canAccess(PermissionsEnum.OrganizationRead)).toBeTrue();
    unsubscribe();
  });

  it('should wait for the next load once invalidated, even from the cache', async () => {
    const load = service.loadPermissions('org-a');
    flush('org-a', []);
    await load;

    service.invalidate();
    const unsubscribe = subscribe();
    expect(readyCount).toBe(0);

    await service.loadPermissions('org-a');
    expect(readyCount).toBe(1);
    unsubscribe();
  });

  it('should ignore permissions that resolve after the state changed', async () => {
    const unsubscribe = subscribe();
    const stale = service.loadPermissions('org-a');
    service.invalidate();
    flush('org-a', ['stale']);
    await stale;
    expect(readyCount).toBe(0);
    expect(service.permissions()).toEqual([]);

    const load = service.loadPermissions('org-b');
    flush('org-b', ['fresh']);
    await load;
    expect(readyCount).toBe(1);
    expect(service.permissions()).toEqual(['fresh']);
    unsubscribe();
  });
});
