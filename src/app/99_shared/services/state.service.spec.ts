import { TestBed } from '@angular/core/testing';

import { StateService } from './state.service';
import { OrganizationService } from './organization.service';
import { PermissionService } from './permission.service';
import { AZService } from '@products/00_shared/services/az.service';
import { AZ } from '@products/00_shared/models/product.model';
import { of, Subject } from 'rxjs';
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

    permSvcSpy = jasmine.createSpyObj('PermissionService', ['loadPermissions']);

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
      const newAzList: AZ[] = [
        { code: 'az3', name: 'Zone 3', logoUrl: 'https://cdn.example.com/az3.svg' },
      ];

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
  });
});
