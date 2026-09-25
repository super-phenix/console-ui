import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SecurityGroupDetailsComponent } from './security-group-details.component';
import { SecurityGroupService } from '@products/00_shared/services/security-group.service';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { StateService } from '@shared/services/state.service';
import { PermissionService } from '@shared/services/permission.service';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { APP_NAME_CLUSTER_LABEL_VALUE, APP_NAME_LABEL_KEY } from '@shared/models/consts';
import { ProductSecurityGroup, ProductSubnet } from '@products/00_shared/models/product.model';
import { SecurityGroupActions } from '../security-group-actions.utils';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

const baseSgProduct: ProductSecurityGroup = {
  id: 'local-1',
  eid: 'sg-eid-1',
  productName: 'Test SG',
  codeAZ: 'az-1',
  gitops: 'false',
  productTypeId: 'sg-type',
  securityGroup: {
    metadata: { name: 'test-sg', namespace: 'default', labels: {}, ownerReferences: [] },
    description: 'A test security group',
    spec: {
      ingress: [],
      egress: [],
      podSelector: { matchLabels: new Map<string, string>(), matchExpressions: [] },
      policyTypes: ['Ingress', 'Egress'],
    },
  },
};

const mockSubnets: ProductSubnet[] = [
  {
    id: 'subnet-local-1',
    eid: 'subnet-eid-1',
    productName: 'My Subnet 1',
    codeAZ: 'az-1',
    gitops: 'false',
    subnet: {
      kind: 'Subnet',
      apiVersion: 'v1',
      metadata: { name: 'subnet-1', namespace: 'default', labels: {}, ownerReferences: [] },
      isShared: false,
      spec: {
        default: false,
        cidrBlock: '10.0.0.0/24',
        gateway: '10.0.0.1',
        gatewayNode: 'node-1',
        natOutgoing: true,
        private: false,
        dhcpV4Options: null,
        dhcpV6Options: null,
        protocol: 'IPv4',
      },
      status: {
        v4availableIPs: 250,
        v4availableIPrange: '',
        v4usingIPs: 5,
        v4usingIPrange: '',
        v6availableIPs: 0,
        v6availableIPrange: '',
        v6usingIPs: 0,
        v6usingIPrange: '',
        activateGateway: '',
        natOutgoingPolicyRules: [],
      },
    },
  },
  {
    id: 'subnet-local-2',
    eid: 'subnet-eid-2',
    productName: 'My Subnet 2',
    codeAZ: 'az-1',
    gitops: 'false',
    subnet: {
      kind: 'Subnet',
      apiVersion: 'v1',
      metadata: { name: 'subnet-2', namespace: 'default', labels: {}, ownerReferences: [] },
      isShared: false,
      spec: {
        default: false,
        cidrBlock: '10.0.1.0/24',
        gateway: '10.0.1.1',
        gatewayNode: 'node-2',
        natOutgoing: true,
        private: false,
        dhcpV4Options: null,
        dhcpV6Options: null,
        protocol: 'IPv4',
      },
      status: {
        v4availableIPs: 250,
        v4availableIPrange: '',
        v4usingIPs: 3,
        v4usingIPrange: '',
        v6availableIPs: 0,
        v6availableIPrange: '',
        v6usingIPs: 0,
        v6usingIPrange: '',
        activateGateway: '',
        natOutgoingPolicyRules: [],
      },
    },
  },
];

describe('SecurityGroupDetailsComponent', () => {
  let component: SecurityGroupDetailsComponent;
  let fixture: ComponentFixture<SecurityGroupDetailsComponent>;
  let sgServiceSpy: jasmine.SpyObj<SecurityGroupService>;
  let subnetServiceSpy: jasmine.SpyObj<SubnetService>;

  function setup(sgProduct: ProductSecurityGroup, subnets: ProductSubnet[] = []) {
    sgServiceSpy = jasmine.createSpyObj('SecurityGroupService', ['get']);
    sgServiceSpy.get.and.returnValue(of(sgProduct));

    subnetServiceSpy = jasmine.createSpyObj('SubnetService', ['listByAZ']);
    subnetServiceSpy.listByAZ.and.returnValue(of(subnets));

    const stateServiceStub = {
      organization: signal({ id: 'org-1' }),
      project: signal({ id: 'proj-1' }),
    };

    const permissionServiceStub = {
      permissions: signal([]),
    };

    const activatedRouteStub = {
      params: of({ az: 'az-1', id: 'sg-eid-1' }),
      snapshot: { paramMap: { get: (key: string) => (key === 'az' ? 'az-1' : 'sg-eid-1') } },
    };

    TestBed.configureTestingModule({
      imports: [SecurityGroupDetailsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SecurityGroupService, useValue: sgServiceSpy },
        { provide: SubnetService, useValue: subnetServiceSpy },
        { provide: StateService, useValue: stateServiceStub },
        { provide: PermissionService, useValue: permissionServiceStub },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityGroupDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    setup(baseSgProduct);
    expect(component).toBeTruthy();
  });

  it('should display subnet details when subnetEIds are present and subnets are fetched', async () => {
    const sgWithSubnets: ProductSecurityGroup = {
      ...baseSgProduct,
      securityGroup: {
        ...baseSgProduct.securityGroup!,
        subnetEIds: ['subnet-eid-1', 'subnet-eid-2'],
      },
    };
    setup(sgWithSubnets, mockSubnets);

    await fixture.whenStable();
    fixture.detectChanges();

    const nativeEl: HTMLElement = fixture.nativeElement;
    const headings = Array.from(nativeEl.querySelectorAll('h2'));
    const subnetsHeading = headings.find(h => h.textContent?.trim() === 'Subnets');
    expect(subnetsHeading).toBeTruthy();

    const subnetSection = subnetsHeading!.nextElementSibling as HTMLElement;
    expect(subnetSection.textContent).toContain('My Subnet 1');
    expect(subnetSection.textContent).toContain('My Subnet 2');
    expect(subnetSection.textContent).toContain('10.0.0.0/24');
    expect(subnetSection.textContent).toContain('10.0.1.0/24');
    expect(subnetSection.textContent).toContain('10.0.0.1');
    expect(subnetSection.textContent).toContain('10.0.1.1');
  });

  it('should fetch subnets via SubnetService.listByAZ when subnetEIds are present', async () => {
    const sgWithSubnets: ProductSecurityGroup = {
      ...baseSgProduct,
      securityGroup: {
        ...baseSgProduct.securityGroup!,
        subnetEIds: ['subnet-eid-1'],
      },
    };
    setup(sgWithSubnets, mockSubnets);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(subnetServiceSpy.listByAZ).toHaveBeenCalledWith('org-1', 'proj-1', 'az-1');
  });

  it('should show fallback for unresolved subnet EIDs', async () => {
    const sgWithSubnets: ProductSecurityGroup = {
      ...baseSgProduct,
      securityGroup: {
        ...baseSgProduct.securityGroup!,
        subnetEIds: ['subnet-eid-1', 'subnet-eid-unknown'],
      },
    };
    setup(sgWithSubnets, [mockSubnets[0]]);

    await fixture.whenStable();
    fixture.detectChanges();

    const nativeEl: HTMLElement = fixture.nativeElement;
    expect(nativeEl.textContent).toContain('My Subnet 1');
    expect(nativeEl.textContent).toContain('Unknown Subnet');
    expect(nativeEl.textContent).toContain('subnet-eid-unknown');
  });

  it('should not display subnets section when subnetEIds is empty', async () => {
    const sgWithoutSubnets: ProductSecurityGroup = {
      ...baseSgProduct,
      securityGroup: {
        ...baseSgProduct.securityGroup!,
        subnetEIds: [],
      },
    };
    setup(sgWithoutSubnets);

    await fixture.whenStable();
    fixture.detectChanges();

    const nativeEl: HTMLElement = fixture.nativeElement;
    const headings = Array.from(nativeEl.querySelectorAll('h2'));
    const subnetsHeading = headings.find(h => h.textContent?.trim() === 'Subnets');
    expect(subnetsHeading).toBeFalsy();
  });

  it('should not display subnets section when subnetEIds is undefined', async () => {
    setup(baseSgProduct);

    await fixture.whenStable();
    fixture.detectChanges();

    const nativeEl: HTMLElement = fixture.nativeElement;
    const headings = Array.from(nativeEl.querySelectorAll('h2'));
    const subnetsHeading = headings.find(h => h.textContent?.trim() === 'Subnets');
    expect(subnetsHeading).toBeFalsy();
  });

  it('should have routerLink to subnet details page for resolved subnets', async () => {
    const sgWithSubnets: ProductSecurityGroup = {
      ...baseSgProduct,
      securityGroup: {
        ...baseSgProduct.securityGroup!,
        subnetEIds: ['subnet-eid-1'],
      },
    };
    setup(sgWithSubnets, mockSubnets);

    await fixture.whenStable();
    fixture.detectChanges();

    const nativeEl: HTMLElement = fixture.nativeElement;
    const subnetCards = nativeEl.querySelectorAll('.product-details__card');
    const subnetCard = Array.from(subnetCards).find(card => card.textContent?.includes('My Subnet 1'));
    expect(subnetCard).toBeTruthy();
    const redirectLink = subnetCard!.querySelector('a[mat-icon-button]') as HTMLAnchorElement;
    expect(redirectLink).toBeTruthy();
    expect(redirectLink.getAttribute('href')).toBe('/products/network/subnet/details/az-1/subnet-eid-1');
  });

  it('should not fetch subnets when subnetEIds is empty', async () => {
    const sgWithoutSubnets: ProductSecurityGroup = {
      ...baseSgProduct,
      securityGroup: {
        ...baseSgProduct.securityGroup!,
        subnetEIds: [],
      },
    };
    setup(sgWithoutSubnets);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(subnetServiceSpy.listByAZ).not.toHaveBeenCalled();
  });

  it('should identify cluster security group and call SecurityGroupActions.redirectToParentKaas on redirectToCluster', async () => {
    const clusterSg: ProductSecurityGroup = {
      ...baseSgProduct,
      securityGroup: {
        ...baseSgProduct.securityGroup!,
        metadata: {
          ...baseSgProduct.securityGroup!.metadata,
          labels: {
            [APP_NAME_LABEL_KEY]: APP_NAME_CLUSTER_LABEL_VALUE,
            'superphenix.net/resourceLocalID': '6ba7b810-9dad-11d1-80b4-00c04fd430c8-sg',
            'superphenix.net/projectID': 'spx-e82b7936-cb8c-4a37-b648-8df04e8aa153',
          },
        },
      },
    };
    setup(clusterSg);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isClusterSecurityGroup()).toBeTrue();

    spyOn(SecurityGroupActions, 'redirectToParentKaas');
    component.redirectToCluster(clusterSg);
    expect(SecurityGroupActions.redirectToParentKaas).toHaveBeenCalledWith(
      jasmine.any(Object),
      'az-1',
      clusterSg
    );
  });
});
