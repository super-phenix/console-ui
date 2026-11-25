import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { RunStrategy } from '@products/00_shared/models/compute/instance/enums/run-strategy.enum';
import { ProductInstance, ProductSubnet } from '@products/00_shared/models/product.model';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { APP_NAME_CLUSTER_LABEL_VALUE, APP_NAME_LABEL_KEY } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { of, throwError } from 'rxjs';

import { InstanceDetailsNetworkComponent } from './instance-details-network.component';

describe('InstanceDetailsNetworkComponent', () => {
  const orgId = 'org-1';
  const projectId = 'proj-1';
  const az = 'az1';
  const eid = 'inst-eid-1';

  let fixture: ComponentFixture<InstanceDetailsNetworkComponent>;
  let component: InstanceDetailsNetworkComponent;
  let instanceSvc: jasmine.SpyObj<InstanceService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackbar: jasmine.SpyObj<MatSnackBar>;
  let permissionsSignal: ReturnType<typeof signal<string[]>>;

  function createMockInstance(options?: {
    devicesInterfaces?: { name: string; model?: string; state?: 'up' | 'down'; macAddress?: string }[];
    vmiInterfaces?: { name: string; ipAddresses?: string[]; linkState?: 'up' | 'down'; mac?: string }[];
    networks?: { name: string; subnetEid?: string; multusNetworkName?: string }[];
    isVmiRunning?: boolean;
    gitops?: string;
    isCluster?: boolean;
  }): ProductInstance {
    const devicesInterfaces = options?.devicesInterfaces ?? [
      { name: 'interface-0', model: 'virtio', state: 'up' },
      { name: 'interface-1', model: 'virtio', state: 'down' },
    ];
    const networks = options?.networks ?? [
      { name: 'interface-0', subnetEid: 'subnet-eid-0' },
      { name: 'interface-1', subnetEid: 'subnet-eid-1' },
    ];
    const vmiInterfaces = options?.vmiInterfaces ?? [
      { name: 'interface-0', ipAddresses: ['10.0.0.10'], linkState: 'up' },
      { name: 'interface-1', ipAddresses: ['10.0.1.10'], linkState: 'down' },
    ];

    const isRunning = options?.isVmiRunning ?? true;

    return {
      id: 'inst-1',
      eid,
      productName: 'test-instance',
      codeAZ: az,
      gitops: options?.gitops ?? 'false',
      vm: {
        metadata: {
          name: 'test-instance',
          labels: options?.isCluster ? { [APP_NAME_LABEL_KEY]: APP_NAME_CLUSTER_LABEL_VALUE } : {},
          annotations: {},
        },
        spec: {
          runStrategy: RunStrategy.Manual,
          preference: { name: 'c1.small' },
          template: {
            metadata: {},
            spec: {
              domain: {
                cpu: { cores: 2 },
                memory: { guest: '4Gi' },
                devices: {
                  disks: [],
                  interfaces: devicesInterfaces,
                },
              },
              networks: networks.map(n => ({
                name: n.name,
                multus: { networkName: n.multusNetworkName ?? `spx-${projectId}/${n.subnetEid}` },
              })),
            },
          },
        },
      },
      vmi: isRunning
        ? {
            status: {
              phase: 'Running',
              interfaces: vmiInterfaces,
            },
            spec: {
              domain: {
                devices: {
                  interfaces: devicesInterfaces,
                },
              },
              networks: networks.map(n => ({
                name: n.name,
                multus: { networkName: n.multusNetworkName ?? `spx-${projectId}/${n.subnetEid}` },
              })),
            },
          }
        : undefined,
    } as unknown as ProductInstance;
  }

  function createMockSubnetsMap(): Map<string, ProductSubnet | undefined> {
    const map = new Map<string, ProductSubnet | undefined>();
    map.set('interface-0', {
      id: 'sub-0',
      eid: 'subnet-eid-0',
      productName: 'default-subnet',
      subnet: { spec: { cidrBlock: '10.0.0.0/24' } },
    } as ProductSubnet);
    map.set('interface-1', {
      id: 'sub-1',
      eid: 'subnet-eid-1',
      productName: 'secondary-subnet',
      subnet: { spec: { cidrBlock: '10.0.1.0/24' } },
    } as ProductSubnet);
    return map;
  }

  beforeEach(async () => {
    permissionsSignal = signal<string[]>([PermissionsEnum.ProjectInstanceWrite]);

    instanceSvc = jasmine.createSpyObj<InstanceService>('InstanceService', ['update']);
    instanceSvc.update.and.returnValue(of({}));

    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as ReturnType<MatDialog['open']>);

    snackbar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [InstanceDetailsNetworkComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: InstanceService, useValue: instanceSvc },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackbar },
        {
          provide: PermissionService,
          useValue: { permissions: permissionsSignal },
        },
        {
          provide: StateService,
          useValue: {
            organization: signal({ id: orgId }),
            project: signal({ id: projectId }),
            azList: signal([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InstanceDetailsNetworkComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('az', az);
    fixture.componentRef.setInput('instance', createMockInstance());
    fixture.componentRef.setInput('subnetsMap', createMockSubnetsMap());
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create and render interface cards', () => {
    expect(component).toBeTruthy();
    const cards = fixture.nativeElement.querySelectorAll('.interface-card');
    expect(cards.length).toBe(2);
  });

  it('should render primary icon on the first interface and not on secondary', () => {
    const cards = fixture.nativeElement.querySelectorAll('.interface-card');
    const primaryIconFirst = cards[0].querySelector('.primary-icon');
    const primaryIconSecond = cards[1].querySelector('.primary-icon');

    expect(primaryIconFirst).toBeTruthy();
    expect(primaryIconFirst?.textContent?.trim()).toBe('star');
    expect(primaryIconSecond).toBeFalsy();
  });

  it('should render subnet details and link to subnet details page', () => {
    const cards = fixture.nativeElement.querySelectorAll('.interface-card');
    const firstCard = cards[0];

    const subnetLink = firstCard.querySelector('a[aria-label="View subnet details"]');
    expect(subnetLink?.getAttribute('href')).toBe(`/products/network/subnet/details/${az}/subnet-eid-0`);

    expect(firstCard.textContent).toContain('default-subnet');
    expect(firstCard.textContent).toContain('10.0.0.0/24');
  });

  it('should render Multus network name when interface is not linked to a subnet', async () => {
    const unlinkedMock = createMockInstance({
      networks: [{ name: 'interface-custom', multusNetworkName: 'custom-bridge-net' }],
      devicesInterfaces: [{ name: 'interface-custom', model: 'virtio', state: 'up' }],
      vmiInterfaces: [{ name: 'interface-custom', ipAddresses: ['192.168.1.50'], linkState: 'up' }],
    });

    fixture.componentRef.setInput('instance', unlinkedMock);
    fixture.componentRef.setInput('subnetsMap', new Map());
    fixture.detectChanges();
    await fixture.whenStable();

    const card = fixture.nativeElement.querySelector('.interface-card');
    expect(card.textContent).toContain('Network Name:');
    expect(card.textContent).toContain('custom-bridge-net');
  });

  it('should render MAC address and mount type', () => {
    const vmIface = component.getVmInterface('interface-0', 0);
    expect(vmIface?.model).toBe('virtio');

    const cards = fixture.nativeElement.querySelectorAll('.interface-card');
    expect(cards[0].textContent).toContain('virtio');
    expect(cards[0].textContent).toContain('Hardware Specifications');
  });

  it('should render empty state banner when no network interfaces exist', async () => {
    const emptyMock = createMockInstance({
      networks: [],
      devicesInterfaces: [],
      vmiInterfaces: [],
    });
    if (emptyMock.vm?.spec?.template?.spec) {
      emptyMock.vm.spec.template.spec.networks = [];
    }
    if (emptyMock.vmi?.spec) {
      emptyMock.vmi.spec.networks = [];
    }

    fixture.componentRef.setInput('instance', emptyMock);
    fixture.detectChanges();
    await fixture.whenStable();

    const banner = fixture.nativeElement.querySelector('spx-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('No network interfaces attached to this instance.');
  });

  it('should correctly report desired and carrier states', () => {
    const vmIface0 = component.getVmInterface('interface-0', 0);
    const vmiIface0 = component.getVmiInterface('interface-0', 0);
    expect(component.isInterfaceDesiredUp(vmIface0)).toBeTrue();
    expect(component.getOperationalCarrierState(vmiIface0)).toBe('Link Up');

    const vmIface1 = component.getVmInterface('interface-1', 1);
    const vmiIface1 = component.getVmiInterface('interface-1', 1);
    expect(component.isInterfaceDesiredUp(vmIface1)).toBeFalse();
    expect(component.getOperationalCarrierState(vmiIface1)).toBe('Link Down');
  });

  it('should display "Instance stopped" carrier state when VM is not running', async () => {
    const stoppedMock = createMockInstance({ isVmiRunning: false });
    fixture.componentRef.setInput('instance', stoppedMock);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isVmRunning()).toBeFalse();
    expect(component.getOperationalCarrierState(undefined)).toBe('Instance stopped');
  });

  it('should display warning badge when primary interface is desired down', async () => {
    const disabledPrimaryMock = createMockInstance({
      devicesInterfaces: [
        { name: 'interface-0', model: 'virtio', state: 'down' },
        { name: 'interface-1', model: 'virtio', state: 'up' },
      ],
    });
    fixture.componentRef.setInput('instance', disabledPrimaryMock);
    fixture.detectChanges();
    await fixture.whenStable();

    const cards = fixture.nativeElement.querySelectorAll('.interface-card');
    const warningBadge = cards[0].querySelector('.warning-badge');
    expect(warningBadge).toBeTruthy();
    expect(warningBadge?.textContent).toContain('Primary interface disabled');

    // Secondary interface disabled should not have primary warning badge
    const warningBadgeSec = cards[1].querySelector('.warning-badge');
    expect(warningBadgeSec).toBeFalsy();
  });

  it('should prompt confirmation dialog when clicking disable on primary interface', () => {
    component.toggleInterfaceLink('interface-0', false);

    expect(dialog.open).toHaveBeenCalled();
    const dialogArgs = dialog.open.calls.mostRecent().args;
    expect(dialogArgs[1]?.data).toEqual(
      jasmine.objectContaining({
        title: 'Disable primary interface?',
        confirmBtn: 'Disable',
      })
    );
    expect(instanceSvc.update).toHaveBeenCalled();
  });

  it('should not call update when primary interface disable dialog is cancelled', () => {
    dialog.open.and.returnValue({ afterClosed: () => of(undefined) } as ReturnType<MatDialog['open']>);

    component.toggleInterfaceLink('interface-0', false);

    expect(dialog.open).toHaveBeenCalled();
    expect(instanceSvc.update).not.toHaveBeenCalled();
  });

  it('should toggle secondary interface directly without prompt', () => {
    component.toggleInterfaceLink('interface-1', true);

    expect(dialog.open).not.toHaveBeenCalled();
    expect(instanceSvc.update).toHaveBeenCalledWith(
      orgId,
      projectId,
      az,
      eid,
      jasmine.objectContaining({
        network: [
          jasmine.objectContaining({ order: 0, enabled: true }),
          jasmine.objectContaining({ order: 1, enabled: true }),
        ],
      })
    );
    expect(snackbar.open).toHaveBeenCalledWith('Network interface link state updated', undefined, jasmine.any(Object));
  });

  it('should disable action button when user lacks write permission', () => {
    permissionsSignal.set([]);
    expect(component.canToggleLinkState()).toBeFalse();

    permissionsSignal.set([PermissionsEnum.ProjectInstanceWrite]);
    expect(component.canToggleLinkState()).toBeTrue();
  });

  it('should disable action button when instance is gitops-managed or cluster resource', async () => {
    const gitopsMock = createMockInstance({ gitops: 'true' });
    fixture.componentRef.setInput('instance', gitopsMock);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.canToggleLinkState()).toBeFalse();

    const clusterMock = createMockInstance({ isCluster: true });
    fixture.componentRef.setInput('instance', clusterMock);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.canToggleLinkState()).toBeFalse();
  });

  it('should emit dataChanged and manage polling lifecycle when toggling link state', () => {
    jasmine.clock().install();
    try {
      spyOn(component.dataChanged, 'emit');

      component.toggleInterfaceLink('interface-1', true);
      expect(component.isUpdatingLinkState('interface-1')).toBeTrue();
      expect(component.dataChanged.emit).toHaveBeenCalled();

      // Advance timers across polling attempts
      jasmine.clock().tick(7500);

      expect(component.isUpdatingLinkState('interface-1')).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('should stop polling early when carrier state reconciles with desired state', () => {
    jasmine.clock().install();
    try {
      const reconciledMock = createMockInstance({
        devicesInterfaces: [
          { name: 'interface-0', model: 'virtio', state: 'up' },
          { name: 'interface-1', model: 'virtio', state: 'up' },
        ],
        vmiInterfaces: [
          { name: 'interface-0', ipAddresses: ['10.0.0.10'], linkState: 'up' },
          { name: 'interface-1', ipAddresses: ['10.0.1.10'], linkState: 'up' },
        ],
      });

      component.toggleInterfaceLink('interface-1', true);
      expect(component.isUpdatingLinkState('interface-1')).toBeTrue();

      fixture.componentRef.setInput('instance', reconciledMock);
      jasmine.clock().tick(1500);

      expect(component.isUpdatingLinkState('interface-1')).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('should clean up updating state when instance update returns an error', () => {
    instanceSvc.update.and.returnValue(throwError(() => new Error('API update failure')));

    component.toggleInterfaceLink('interface-1', true);

    expect(component.isUpdatingLinkState('interface-1')).toBeFalse();
  });

  it('should clean up all active poll subscriptions on component destruction', () => {
    jasmine.clock().install();
    try {
      component.toggleInterfaceLink('interface-1', true);
      expect(component.isUpdatingLinkState('interface-1')).toBeTrue();

      component.ngOnDestroy();

      jasmine.clock().tick(5000);
      expect(component.isUpdatingLinkState('interface-1')).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
