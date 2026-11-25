import { TestBed } from '@angular/core/testing';

import { StateService } from './state.service';
import { OrganizationService } from './organization.service';
import { PermissionService } from './permission.service';
import { AZService } from '@products/00_shared/services/az.service';
import { AZ } from '@products/00_shared/models/product.model';
import { of, Subject, throwError } from 'rxjs';
import { Organization } from '../models/data/organization';

describe('StateService', () => {
  let service: StateService;
  let azSvcSpy: jasmine.SpyObj<AZService>;
  let orgSvcSpy: jasmine.SpyObj<OrganizationService>;
  let permSvcSpy: jasmine.SpyObj<PermissionService>;

  const mockAzList: AZ[] = [
    { code: 'az1', name: 'Zone 1', logoUrl: 'https://cdn.example.com/az1.svg' },
    { code: 'az2', name: 'Zone 2', logoUrl: 'https://cdn.example.com/az2.svg' },
  ];

  beforeEach(() => {
    azSvcSpy = jasmine.createSpyObj('AZService', ['listAZs']);
    azSvcSpy.listAZs.and.returnValue(of(mockAzList));

    orgSvcSpy = jasmine.createSpyObj('OrganizationService', ['getOrg'], {
      needRefresh: new Subject<void>(),
    });

    permSvcSpy = jasmine.createSpyObj('PermissionService', ['loadPermissions', 'invalidate']);

    TestBed.configureTestingModule({
      providers: [
        StateService,
        { provide: AZService, useValue: azSvcSpy },
        { provide: OrganizationService, useValue: orgSvcSpy },
        { provide: PermissionService, useValue: permSvcSpy },
      ],
    });
    service = TestBed.inject(StateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have an empty azList by default', () => {
    expect(service.azList()).toEqual([]);
  });

  describe('setOrganization', () => {
    const orgId = 'org-123';
    const mockOrg = { id: orgId, projects: [] } as unknown as Organization;

    it('should load azList when an organization is selected', async () => {
      orgSvcSpy.getOrg.and.returnValue(of(mockOrg));

      await service.setOrganization(orgId);
      // Wait for the fire-and-forget AZ promise
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(azSvcSpy.listAZs).toHaveBeenCalledWith(orgId);
      expect(service.azList()).toEqual(mockAzList);
    });

    it('should update azList when organization changes', async () => {
      const newOrgId = 'org-456';
      const newMockOrg = { id: newOrgId, projects: [] } as unknown as Organization;
      const newAzList: AZ[] = [{ code: 'az3', name: 'Zone 3', logoUrl: 'https://cdn.example.com/az3.svg' }];

      orgSvcSpy.getOrg.and.returnValue(of(mockOrg));
      await service.setOrganization(orgId);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(service.azList()).toEqual(mockAzList);

      orgSvcSpy.getOrg.and.returnValue(of(newMockOrg));
      azSvcSpy.listAZs.and.returnValue(of(newAzList));
      await service.setOrganization(newOrgId);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(azSvcSpy.listAZs).toHaveBeenCalledWith(newOrgId);
      expect(service.azList()).toEqual(newAzList);
    });

    it('should not reload azList when same organization is set without forceRefresh', async () => {
      orgSvcSpy.getOrg.and.returnValue(of(mockOrg));
      await service.setOrganization(orgId);
      await new Promise(resolve => setTimeout(resolve, 0));

      azSvcSpy.listAZs.calls.reset();
      await service.setOrganization(orgId);
      expect(azSvcSpy.listAZs).not.toHaveBeenCalled();
    });

    it('should resolve to true when the organization is loaded', async () => {
      orgSvcSpy.getOrg.and.returnValue(of(mockOrg));

      expect(await service.setOrganization(orgId)).toBeTrue();
    });

    it('should resolve to false and keep the current organization when loading fails', async () => {
      orgSvcSpy.getOrg.and.returnValue(of(mockOrg));
      await service.setOrganization(orgId);

      orgSvcSpy.getOrg.and.returnValue(throwError(() => new Error('403')));
      expect(await service.setOrganization('org-forbidden')).toBeFalse();
      expect(service.organization()?.id).toBe(orgId);
    });

    describe('concurrent switches', () => {
      let slow: Subject<Organization>;
      let first: Promise<boolean>;

      beforeEach(() => {
        slow = new Subject();
        orgSvcSpy.getOrg.and.callFake(id =>
          id === orgId ? slow : of({ id, projects: [] } as unknown as Organization)
        );
        first = service.setOrganization(orgId);
      });

      it('should ignore an older switch that resolves after a newer one', async () => {
        expect(await service.setOrganization('org-456')).toBeTrue();

        slow.next(mockOrg);
        expect(await first).toBeFalse();
        expect(service.organization()?.id).toBe('org-456');
      });

      it('should still apply an older switch when the newer one failed', async () => {
        orgSvcSpy.getOrg.and.returnValue(throwError(() => new Error('403')));
        expect(await service.setOrganization('org-456')).toBeFalse();

        slow.next(mockOrg);
        expect(await first).toBeTrue();
        expect(service.organization()?.id).toBe(orgId);
      });

      it('should ignore the AZ list of the previous organization', async () => {
        const slowAzs = new Subject<AZ[]>();
        azSvcSpy.listAZs.and.callFake(id => (id === orgId ? slowAzs : of([mockAzList[1]])));
        slow.next(mockOrg);
        await first;
        await service.setOrganization('org-456');

        slowAzs.next(mockAzList);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(service.azList()).toEqual([mockAzList[1]]);
      });
    });

    it('should invalidate the permissions before the debounced reload', async () => {
      orgSvcSpy.getOrg.and.returnValue(of(mockOrg));

      await service.setOrganization(orgId);

      expect(permSvcSpy.invalidate).toHaveBeenCalled();
      expect(permSvcSpy.loadPermissions).not.toHaveBeenCalled();
    });

    describe('projects', () => {
      const orgWithProjects = {
        id: orgId,
        projects: [
          { id: 'p10', name: 'project10' },
          { id: 'pz', name: 'Zeta' },
          { id: 'p2', name: 'project2' },
          { id: 'pd', name: 'default' },
        ],
      } as unknown as Organization;

      beforeEach(() => {
        localStorage.removeItem('project');
        orgSvcSpy.getOrg.and.returnValue(of(orgWithProjects));
      });

      afterEach(() => localStorage.removeItem('project'));

      it('should sort projects by name', async () => {
        await service.setOrganization(orgId);

        expect(service.organization()!.projects.map(p => p.name)).toEqual(['default', 'project2', 'project10', 'Zeta']);
      });

      it('should not reorder the fetched organization', async () => {
        await service.setOrganization(orgId);

        expect(orgWithProjects.projects[0].id).toBe('p10');
      });

      it('should select the first project by name when none is cached', async () => {
        await service.setOrganization(orgId);

        expect(service.project()?.id).toBe('pd');
      });

      it('should keep the cached project', async () => {
        localStorage.setItem('project', 'pz');

        await service.setOrganization(orgId);

        expect(service.project()?.id).toBe('pz');
      });

      it('should handle an organization without projects', async () => {
        orgSvcSpy.getOrg.and.returnValue(of({ id: orgId, projects: null } as unknown as Organization));

        await service.setOrganization(orgId);

        expect(service.organization()!.projects).toEqual([]);
        expect(service.project()).toBeUndefined();
      });
    });
  });
});
