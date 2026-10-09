import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { RunStrategy } from '@products/00_shared/models/compute/instance/enums/run-strategy.enum';
import { CreateInstanceNetwork, UpdateInstance } from '@products/00_shared/models/compute/instance/instance';
import { InterfaceElement } from '@products/00_shared/models/compute/instance/vmi.model';
import { ProductInstance, ProductSubnet } from '@products/00_shared/models/product.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { SshService } from '@products/00_shared/services/ssh.service';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { ConfirmData } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';

import { InstanceUpdateComponent } from './instance-update.component';

describe('InstanceUpdateComponent', () => {
  const orgId = 'org-1';
  const projectId = 'proj-1';
  const az = 'az1';
  const eid = 'inst-eid-1';

  let fixture: ComponentFixture<InstanceUpdateComponent>;
  let component: InstanceUpdateComponent;
  let instanceSvc: jasmine.SpyObj<InstanceService>;
  let subnetSvc: jasmine.SpyObj<SubnetService>;
  let diskSvc: jasmine.SpyObj<DiskService>;
  let sshSvc: jasmine.SpyObj<SshService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  function createMockInstance(
    interfaces: { name: string; model?: string; state?: 'up' | 'down' }[],
    networks: { name: string; subnetEid: string }[]
  ): ProductInstance {
    const annotations: Record<string, string> = {};
    networks.forEach((net, idx) => {
      annotations[`${net.subnetEid}.spx-${projectId}.ovn.kubernetes.io/ip_address`] = `10.0.${idx}.10`;
    });

    return {
      id: 'inst-1',
      eid,
      productName: 'test-instance',
      codeAZ: az,
      vm: {
        metadata: {
          name: 'test-instance',
          labels: {},
        },
        spec: {
          runStrategy: RunStrategy.Manual,
          preference: { name: 'c1.small' },
          template: {
            metadata: { annotations },
            spec: {
              domain: {
                cpu: { cores: 2 },
                memory: { guest: '4Gi' },
                devices: {
                  disks: [],
                  interfaces,
                },
              },
              networks: networks.map(n => ({
                name: n.name,
                multus: { networkName: `spx-${projectId}/${n.subnetEid}` },
              })),
            },
          },
        },
      },
    } as unknown as ProductInstance;
  }

  beforeEach(async () => {
    instanceSvc = jasmine.createSpyObj<InstanceService>('InstanceService', [
      'get',
      'update',
      'listInstanceType',
      'getInstanceTypeAdvancedOptions',
      'getAdvancedOptions',
      'listGpuClasses',
    ]);
    instanceSvc.get.and.returnValue(
      of(
        createMockInstance(
          [
            { name: 'interface-0', model: 'virtio', state: 'up' },
            { name: 'interface-1', model: 'virtio', state: 'down' },
          ],
          [
            { name: 'interface-0', subnetEid: 'subnet-eid-0' },
            { name: 'interface-1', subnetEid: 'subnet-eid-1' },
          ]
        )
      )
    );
    instanceSvc.getAdvancedOptions.and.returnValue(of({ blocks: [] }));
    instanceSvc.listInstanceType.and.returnValue(of([]));
    instanceSvc.getInstanceTypeAdvancedOptions.and.returnValue(of({ blocks: [] }));
    instanceSvc.update.and.returnValue(of({}));
    instanceSvc.listGpuClasses.and.returnValue(
      of([{ id: 'nvidia-rtx-pro-6000-bse', displayName: 'NVIDIA RTX PRO 6000' }])
    );

    subnetSvc = jasmine.createSpyObj<SubnetService>('SubnetService', ['listByAZ']);
    subnetSvc.listByAZ.and.returnValue(
      of([
        { id: 'sub-0', eid: 'subnet-eid-0', subnet: { spec: { cidrBlock: '10.0.0.0/24' } } } as ProductSubnet,
        { id: 'sub-1', eid: 'subnet-eid-1', subnet: { spec: { cidrBlock: '10.0.1.0/24' } } } as ProductSubnet,
      ])
    );

    diskSvc = jasmine.createSpyObj<DiskService>('DiskService', ['listByAZ']);
    diskSvc.listByAZ.and.returnValue(of([]));

    sshSvc = jasmine.createSpyObj<SshService>('SshService', ['list']);
    sshSvc.list.and.returnValue(of([]));

    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as ReturnType<MatDialog['open']>);

    await TestBed.configureTestingModule({
      imports: [InstanceUpdateComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: InstanceService, useValue: instanceSvc },
        { provide: SubnetService, useValue: subnetSvc },
        { provide: DiskService, useValue: diskSvc },
        { provide: SshService, useValue: sshSvc },
        { provide: MatDialog, useValue: dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ az, id: eid }) } },
        },
        {
          provide: PermissionService,
          useValue: { permissions: signal<string[]>([PermissionsEnum.ProjectInstanceWrite]) },
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

    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(InstanceUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create and load instance networks with correct enabled flags', () => {
    expect(component).toBeTruthy();
    expect(component.initNetwork.length).toBe(2);
    expect(component.initNetwork[0]).toEqual(
      jasmine.objectContaining({
        order: 0,
        subnetEId: 'subnet-eid-0',
        enabled: true,
        ipv4: '10.0.0.10',
      })
    );
    expect(component.initNetwork[1]).toEqual(
      jasmine.objectContaining({
        order: 1,
        subnetEId: 'subnet-eid-1',
        enabled: false,
        ipv4: '10.0.1.10',
      })
    );
  });

  it('should deterministically match devices interfaces by name rather than array index', () => {
    // Reverse the interfaces order in devices so interface-1 is index 0 and interface-0 is index 1
    const mockWithReorderedInterfaces = createMockInstance(
      [
        { name: 'interface-1', model: 'e1000', state: 'down' },
        { name: 'interface-0', model: 'virtio', state: 'up' },
      ],
      [
        { name: 'interface-0', subnetEid: 'subnet-eid-0' },
        { name: 'interface-1', subnetEid: 'subnet-eid-1' },
      ]
    );

    instanceSvc.get.and.returnValue(of(mockWithReorderedInterfaces));
    component.loadInstance();

    expect(component.initNetwork.length).toBe(2);
    expect(component.initNetwork[0].subnetEId).toBe('subnet-eid-0');
    expect(component.initNetwork[0].enabled).toBe(true);
    expect(component.initNetwork[0].model).toBe('virtio');

    expect(component.initNetwork[1].subnetEId).toBe('subnet-eid-1');
    expect(component.initNetwork[1].enabled).toBe(false);
    expect(component.initNetwork[1].model).toBe('e1000');
  });

  it('should default enabled to true when interface state is omitted or not down', () => {
    const mockLegacyInstance = createMockInstance(
      [
        { name: 'interface-0' }, // state omitted
        { name: 'interface-1', state: 'up' },
      ],
      [
        { name: 'interface-0', subnetEid: 'subnet-eid-0' },
        { name: 'interface-1', subnetEid: 'subnet-eid-1' },
      ]
    );

    instanceSvc.get.and.returnValue(of(mockLegacyInstance));
    component.loadInstance();

    expect(component.initNetwork[0].enabled).toBe(true);
    expect(component.initNetwork[1].enabled).toBe(true);
  });

  it('should display confirmation copy distinguishing reboot-required changes from zero-reboot link state changes', async () => {
    component.firstFormGroup.controls.productName.setValue('test-instance');
    component.networks = [
      { order: 0, subnetEId: 'subnet-eid-0', enabled: true },
      { order: 1, subnetEId: 'subnet-eid-1', enabled: false },
    ];

    await component.update();

    expect(dialog.open).toHaveBeenCalled();
    const data = dialog.open.calls.mostRecent().args[1]?.data as ConfirmData;
    const html = data.html ?? '';
    expect(html).toContain('Resource changes (CPU/RAM/GPU) will only take effect after restarting the instance');
    expect(html).toContain('Network interface link state changes apply dynamically at runtime without rebooting');
  });

  it('should include the enabled boolean flags in update submission payload', async () => {
    const updatedNetworks: CreateInstanceNetwork[] = [
      { order: 0, subnetEId: 'subnet-eid-0', enabled: true, ipv4: '10.0.0.10' },
      { order: 1, subnetEId: 'subnet-eid-1', enabled: true, ipv4: '10.0.1.10' }, // toggled to true
    ];
    component.networks = updatedNetworks;

    await component.update();

    expect(instanceSvc.update).toHaveBeenCalledWith(
      orgId,
      projectId,
      az,
      eid,
      jasmine.objectContaining<UpdateInstance>({
        network: updatedNetworks,
      })
    );
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith([
      '/products',
      'compute',
      'instance',
      'details',
      az,
      eid,
    ]);
  });

  it('should not proceed with update when confirmation dialog is cancelled', async () => {
    dialog.open.and.returnValue({ afterClosed: () => of(false) } as ReturnType<MatDialog['open']>);
    component.networks = [{ order: 0, subnetEId: 'subnet-eid-0', enabled: true }];

    await component.update();

    expect(instanceSvc.update).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
  });

  it('should default enabled to true when domain devices interfaces array is undefined', () => {
    const mockNoInterfaces = createMockInstance(
      [],
      [
        { name: 'interface-0', subnetEid: 'subnet-eid-0' },
        { name: 'interface-1', subnetEid: 'subnet-eid-1' },
      ]
    );
    mockNoInterfaces.vm!.spec.template!.spec.domain.devices.interfaces =
      undefined as unknown as InterfaceElement[];

    instanceSvc.get.and.returnValue(of(mockNoInterfaces));
    component.loadInstance();

    expect(component.initNetwork.length).toBe(2);
    expect(component.initNetwork[0].enabled).toBe(true);
    expect(component.initNetwork[1].enabled).toBe(true);
  });

  it('should preserve disabled link state flags alongside other form updates on submission', async () => {
    component.firstFormGroup.controls.productName.setValue('renamed-instance');
    component.networks = [
      { order: 0, subnetEId: 'subnet-eid-0', enabled: false, ipv4: '10.0.0.10' },
      { order: 1, subnetEId: 'subnet-eid-1', enabled: true, ipv4: '10.0.1.10' },
    ];

    await component.update();

    expect(instanceSvc.update).toHaveBeenCalledWith(
      orgId,
      projectId,
      az,
      eid,
      jasmine.objectContaining<UpdateInstance>({
        general: jasmine.objectContaining({ productName: 'renamed-instance' }),
        network: [
          jasmine.objectContaining({ order: 0, subnetEId: 'subnet-eid-0', enabled: false }),
          jasmine.objectContaining({ order: 1, subnetEId: 'subnet-eid-1', enabled: true }),
        ],
      })
    );
  });

  describe('GPU', () => {
    function instanceWithGpu(): ProductInstance {
      const instance = createMockInstance(
        [{ name: 'interface-0', model: 'virtio', state: 'up' }],
        [{ name: 'interface-0', subnetEid: 'subnet-eid-0' }]
      );
      instance.gpus = [{ id: 'nvidia-rtx-pro-6000-bse', displayName: 'NVIDIA RTX PRO 6000' }];
      return instance;
    }

    beforeEach(() => {
      component.networks = [{ order: 0, subnetEId: 'subnet-eid-0', enabled: true }];
    });

    it('should seed initGpus from the loaded instance', () => {
      instanceSvc.get.and.returnValue(of(instanceWithGpu()));
      component.loadInstance();

      expect(component.initGpus).toEqual([{ id: 'nvidia-rtx-pro-6000-bse', displayName: 'NVIDIA RTX PRO 6000' }]);
    });

    it('should omit compute.gpu when the GPU was not changed, so the backend keeps it', async () => {
      instanceSvc.get.and.returnValue(of(instanceWithGpu()));
      component.loadInstance();

      await component.update();

      const payload = instanceSvc.update.calls.mostRecent().args[4] as UpdateInstance;
      expect(payload.compute.gpu).toBeUndefined();
    });

    it('should send an empty list when the GPU is removed', async () => {
      component.gpus = [];

      await component.update();

      const payload = instanceSvc.update.calls.mostRecent().args[4] as UpdateInstance;
      expect(payload.compute.gpu).toEqual([]);
    });

    it('should send the selected GPU class', async () => {
      component.gpus = ['nvidia-rtx-pro-6000-bse'];

      await component.update();

      const payload = instanceSvc.update.calls.mostRecent().args[4] as UpdateInstance;
      expect(payload.compute.gpu).toEqual([{ device: 'nvidia-rtx-pro-6000-bse' }]);
    });
  });
});
