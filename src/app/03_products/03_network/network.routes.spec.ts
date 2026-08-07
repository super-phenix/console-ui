import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PermissionService } from '@shared/services/permission.service';
import { of } from 'rxjs';
import { NetworkRoutes } from './network.routes';

/**
 * The Firewall product was renamed to Security Group. `network.routes.ts` keeps a
 * legacy `firewall` path so URLs bookmarked or shared before the rename still resolve.
 * These cases cover the four routes the product exposes.
 */
describe('NetworkRoutes legacy firewall redirect', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'products/network', children: NetworkRoutes }]),
        // The security-group route is permission-guarded; grant access so navigation completes.
        { provide: PermissionService, useValue: { isReady: of(true), canAccess: () => true } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  const cases: [string, string][] = [
    ['/products/network/firewall', '/products/network/security-group'],
    ['/products/network/firewall/create', '/products/network/security-group/create'],
    ['/products/network/firewall/details/az1/eid1', '/products/network/security-group/details/az1/eid1'],
    ['/products/network/firewall/update/az1/eid1', '/products/network/security-group/update/az1/eid1'],
  ];

  cases.forEach(([legacy, expected]) => {
    it(`redirects ${legacy} to ${expected}`, async () => {
      await router.navigateByUrl(legacy);
      expect(router.url).toBe(expected);
    });
  });
});
