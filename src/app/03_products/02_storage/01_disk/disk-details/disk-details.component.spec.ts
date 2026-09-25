import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ProductDisk, ProductInstance } from '@products/00_shared/models/product.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { SnapshotService } from '@products/00_shared/services/snapshot.service';
import { APP_NAME_CLUSTER_LABEL_VALUE, APP_NAME_LABEL_KEY } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';
import { DiskActions } from '../disk-actions.utils';
import { DiskDetailsComponent } from './disk-details.component';

describe('DiskDetailsComponent', () => {
  const orgId = 'org-1';
  const projectId = 'proj-1';
  const az = 'az-1';
  const eid = 'disk-eid-1';

  let fixture: ComponentFixture<DiskDetailsComponent>;
  let component: DiskDetailsComponent;
  let diskSvc: jasmine.SpyObj<DiskService>;
  let instanceSvc: jasmine.SpyObj<InstanceService>;
  let snapshotSvc: jasmine.SpyObj<SnapshotService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackbar: jasmine.SpyObj<MatSnackBar>;
  let permissionsSignal: ReturnType<typeof signal<string[]>>;

  function createMockDisk(options?: {
    isMounted?: boolean;
    gitops?: string;
  }): ProductDisk {
    return {
      id: 'disk-1',
      eid,
      productName: 'test-disk',
      codeAZ: az,
      gitops: options?.gitops ?? 'false',
      mountStatus: options?.isMounted
        ? {
            isMounted: true,
            by: 'inst-eid-1',
          }
        : undefined,
      disk: {
        metadata: {
          name: 'test-disk',
          labels: {},
        },
        status: {
          phase: 'Bound',
          conditions: [],
        },
      } as unknown as ProductDisk['disk'],
    } as ProductDisk;
  }

  function createMockInstance(options?: { isCluster?: boolean }): ProductInstance {
    return {
      id: 'inst-1',
      eid: 'inst-eid-1',
      productName: 'test-instance',
      codeAZ: az,
      vm: {
        metadata: {
          name: 'test-instance',
          labels: options?.isCluster
            ? {
                [APP_NAME_LABEL_KEY]: APP_NAME_CLUSTER_LABEL_VALUE,
                'superphenix.net/resourceLocalID': '6ba7b810-9dad-11d1-80b4-00c04fd430c8-inst',
                'superphenix.net/projectID': 'spx-e82b7936-cb8c-4a37-b648-8df04e8aa153',
              }
            : {},
        },
      },
    } as unknown as ProductInstance;
  }

  beforeEach(async () => {
    permissionsSignal = signal<string[]>([PermissionsEnum.ProjectDiskWrite, PermissionsEnum.ProjectKaaSRead]);

    diskSvc = jasmine.createSpyObj<DiskService>('DiskService', ['get', 'delete', 'unmountDisk', 'getArgoLink']);
    diskSvc.get.and.returnValue(of(createMockDisk()));

    instanceSvc = jasmine.createSpyObj<InstanceService>('InstanceService', ['get']);
    instanceSvc.get.and.returnValue(of());

    snapshotSvc = jasmine.createSpyObj<SnapshotService>('SnapshotService', ['list']);

    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as ReturnType<MatDialog['open']>);

    snackbar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [DiskDetailsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DiskService, useValue: diskSvc },
        { provide: InstanceService, useValue: instanceSvc },
        { provide: SnapshotService, useValue: snapshotSvc },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackbar },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ az, id: eid }),
            fragment: of('0'),
          },
        },
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

    fixture = TestBed.createComponent(DiskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create and load disk details', () => {
    expect(component).toBeTruthy();
    expect(component.diskProduct.hasValue()).toBeTrue();
  });

  it('should detect when mounted instance is managed by cluster', async () => {
    diskSvc.get.and.returnValue(of(createMockDisk({ isMounted: true })));
    instanceSvc.get.and.returnValue(of(createMockInstance({ isCluster: true })));
    fixture = TestBed.createComponent(DiskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isClusterInstance()).toBeTrue();
  });

  it('should call DiskActions.redirectToParentKaas on redirectToCluster', () => {
    const mockDisk = createMockDisk();
    spyOn(DiskActions, 'redirectToParentKaas');
    component.redirectToCluster(mockDisk);
    expect(DiskActions.redirectToParentKaas).toHaveBeenCalledWith(
      jasmine.any(Object),
      az,
      mockDisk
    );
  });
});
