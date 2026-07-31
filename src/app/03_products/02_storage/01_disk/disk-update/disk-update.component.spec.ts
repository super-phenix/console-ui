import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { Product, ProductDisk } from '@products/00_shared/models/product.model';
import { PVC } from '@products/00_shared/models/storage/disk/pvc.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { ConfirmData } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { CUSTOM_USER_LABEL_PREFIX } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';

import { DiskUpdateComponent } from './disk-update.component';

describe('DiskUpdateComponent', () => {
  const orgId = 'org1';
  const projectId = 'proj1';
  const az = 'az1';
  const eid = 'eid1';
  const labelKey = `${CUSTOM_USER_LABEL_PREFIX}team`;

  let fixture: ComponentFixture<DiskUpdateComponent>;
  let component: DiskUpdateComponent;
  let diskSvc: jasmine.SpyObj<DiskService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  function diskFixture(gitops: Product['gitops']): ProductDisk {
    return {
      id: 'id1',
      eid,
      codeAZ: az,
      productName: 'my-disk',
      productTypeId: 'type1',
      gitops,
      pvc: {
        metadata: { labels: { [labelKey]: 'core' } },
        status: { phase: 'Bound', capacity: { storage: '20Gi' } },
      } as unknown as PVC,
    };
  }

  /** Builds the component with a disk that is (or is not) GitOps managed. */
  async function setup(gitops: Product['gitops']): Promise<void> {
    diskSvc.get.and.returnValue(of(diskFixture(gitops)));

    fixture = TestBed.createComponent(DiskUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /** Runs update() with the confirm dialog answering "yes" and waits for the call to settle. */
  async function confirmUpdate(): Promise<void> {
    await component.update();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    diskSvc = jasmine.createSpyObj<DiskService>('DiskService', ['get', 'update']);
    diskSvc.update.and.returnValue(of({}));

    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as ReturnType<MatDialog['open']>);

    await TestBed.configureTestingModule({
      imports: [DiskUpdateComponent],
      providers: [
        provideRouter([]),
        { provide: DiskService, useValue: diskSvc },
        { provide: MatDialog, useValue: dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ az, id: eid }) } },
        },
        {
          provide: PermissionService,
          useValue: { permissions: signal<string[]>([PermissionsEnum.ProjectDiskWrite]) },
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
  });

  it('should create', async () => {
    await setup('false');
    expect(component).toBeTruthy();
  });

  describe('GitOps managed disk', () => {
    it('should flag the disk as GitOps managed and warn the user', async () => {
      await setup('true');

      expect(component.isGitops()).toBeTrue();
      const banner: HTMLElement | null = fixture.nativeElement.querySelector('spx-banner');
      expect(banner).not.toBeNull();
      expect(banner?.textContent).toContain('managed by GitOps');
    });

    it('should only allow the size to be changed', async () => {
      await setup('true');

      expect(component.firstFormGroup.controls.productName.disabled).toBeTrue();
      expect(component.firstFormGroup.controls.storage.disabled).toBeFalse();
      expect(fixture.nativeElement.querySelector('spx-step-label')).toBeNull();
    });

    it('should warn about the drift in the confirm dialog', async () => {
      await setup('true');
      await confirmUpdate();

      const data = dialog.open.calls.mostRecent().args[1]?.data as ConfirmData;
      const html = data.html ?? '';
      expect(html).toContain('managed by GitOps');
      expect(html).toContain('revert this change');
    });

    it('should update with force and keep the name and labels untouched', async () => {
      await setup('true');
      component.firstFormGroup.controls.storage.setValue(30);

      await confirmUpdate();

      expect(diskSvc.update).toHaveBeenCalledWith(
        orgId,
        projectId,
        az,
        eid,
        {
          general: {
            productName: 'my-disk',
            labels: [`${labelKey}:core`],
            storage: '30',
          },
        },
        true
      );
    });
  });

  describe('regular disk', () => {
    it('should not warn nor restrict the form', async () => {
      await setup('false');

      expect(component.isGitops()).toBeFalse();
      expect(fixture.nativeElement.querySelector('spx-banner')).toBeNull();
      expect(component.firstFormGroup.controls.productName.disabled).toBeFalse();
      expect(fixture.nativeElement.querySelector('spx-step-label')).not.toBeNull();
    });

    it('should update without force', async () => {
      await setup('false');
      component.firstFormGroup.controls.productName.setValue('renamed-disk');
      component.labels.set([`${labelKey}:other`]);

      await confirmUpdate();

      expect(diskSvc.update).toHaveBeenCalledWith(
        orgId,
        projectId,
        az,
        eid,
        {
          general: {
            productName: 'renamed-disk',
            labels: [`${labelKey}:other`],
            storage: '20',
          },
        },
        false
      );
    });
  });
});
