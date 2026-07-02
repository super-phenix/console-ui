import { TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { StepLabelComponent } from '@products/00_shared/components/forms-step/step-label/step-label.component';
import { ProductDisk, ProductSnapshot } from '@products/00_shared/models/product.model';
import {
  CreateDisk,
  DiskSourceType,
  DiskSourceTypeBlank,
  DiskSourceTypeClone,
  DiskSourceTypeHttp,
  DiskSourceTypeRegistry,
  DiskSourceTypes,
  DiskSourceTypeSnapshot,
} from '@products/00_shared/models/storage/disk/create-disk.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { SnapshotService } from '@products/00_shared/services/snapshot.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { CUSTOM_USER_LABEL_NUMBER, CUSTOM_USER_LABEL_PREFIX, MAX_NAME_LENGTH } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { catchError, firstValueFrom, of } from 'rxjs';

@Component({
  selector: 'spx-disk-create',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatStepperModule,
    MatIconModule,
    ContentHeaderComponent,
    StepGeneralComponent,
    StepLabelComponent,
    TitleCasePipe,
  ],
  templateUrl: './disk-create.component.html',
  styleUrl: './disk-create.component.scss',
})
export class DiskCreateComponent {
  protected stateSvc = inject(StateService);
  protected diskSvc = inject(DiskService);
  protected snapshotSvc = inject(SnapshotService);
  protected permissionSvc = inject(PermissionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  canProjectDiskRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectDiskRead));
  canProjectSnapshotRead = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSnapshotRead)
  );

  maxLength = MAX_NAME_LENGTH;
  readonly CUSTOM_USER_LABEL_PREFIX = CUSTOM_USER_LABEL_PREFIX;
  readonly CUSTOM_USER_LABEL_NUMBER = CUSTOM_USER_LABEL_NUMBER;
  minStorageSize = signal(1);

  DiskSourceTypes = DiskSourceTypes;
  DiskSourceTypeBlank = DiskSourceTypeBlank;

  storageClassList = signal<string[] | undefined>(undefined);
  disksProduct = signal<ProductDisk[] | undefined>(undefined);
  snapshotsProduct = signal<ProductSnapshot[] | undefined>(undefined);

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
  });

  secondFormGroup = this.fb.nonNullable.group({
    storage: this.fb.nonNullable.control('10', [Validators.required]),
    source: this.fb.group({
      type: this.fb.nonNullable.control<DiskSourceType>(DiskSourceTypeRegistry, Validators.required),
      url: this.fb.nonNullable.control('', Validators.required),
      clone: this.fb.nonNullable.control<string | undefined>(undefined),
      snapshot: this.fb.nonNullable.control<string | undefined>(undefined),
    }),
    storageClass: this.fb.nonNullable.control(undefined, [Validators.required]),
  });

  selectedAz = signal<string | null>(null);


  labels = signal<string[]>([]);

  constructor() {
    effect(() => {
      const val = this.selectedAz();
      if (val) {
        this.loadStorageClassList(val);

        if (this.canProjectDiskRead()) {
          this.loadDisks(val);
        }

        if (this.canProjectSnapshotRead()) {
          this.loadSnapshots(val);
        }
      }
    });

    //  Update rules depending on source type
    this.secondFormGroup
      .get(['source', 'type'])
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(v => {
        this.secondFormGroup.get(['source', 'url'])?.removeValidators(Validators.required);
        this.secondFormGroup.get(['source', 'clone'])?.removeValidators(Validators.required);
        this.secondFormGroup.get(['source', 'snapshot'])?.removeValidators(Validators.required);
        switch (v) {
          case DiskSourceTypeRegistry:
          case DiskSourceTypeHttp:
            this.secondFormGroup.get(['source', 'url'])?.addValidators(Validators.required);
            break;
          case DiskSourceTypeClone:
            this.secondFormGroup.get(['source', 'clone'])?.addValidators(Validators.required);
            break;
          case DiskSourceTypeSnapshot:
            this.secondFormGroup.get(['source', 'snapshot'])?.addValidators(Validators.required);
            break;
          case DiskSourceTypeBlank:
            break;
        }

        this.secondFormGroup.get(['source', 'url'])?.updateValueAndValidity();
        this.secondFormGroup.get(['source', 'clone'])?.updateValueAndValidity();
        this.secondFormGroup.get(['source', 'snapshot'])?.updateValueAndValidity();
        this.minStorageSize.set(1);
      });

    //  Update min size storage when clone source is selected
    this.secondFormGroup
      .get(['source', 'clone'])
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(v => {
        if (this.disksProduct()) {
          const disk = this.disksProduct()!.find(d => d.eid === v);
          if (disk && disk.disk?.spec?.storage?.resources?.requests?.['storage']) {
            const size = parseInt(disk.disk?.spec?.storage?.resources?.requests?.['storage']);
            this.minStorageSize.set(size);
          }
        } else {
          this.minStorageSize.set(1);
        }
        this.secondFormGroup.get(['storage'])?.updateValueAndValidity();
      });

    //  Update min size storage when snapshot source is selected
    this.secondFormGroup
      .get(['source', 'snapshot'])
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(v => {
        if (this.snapshotsProduct()) {
          const snapshot = this.snapshotsProduct()!.find(d => d.eid === v);
          if (snapshot && snapshot.snapshot?.status?.restoreSize) {
            const size = parseInt(snapshot.snapshot?.status?.restoreSize);
            this.minStorageSize.set(size);
          }
        } else {
          this.minStorageSize.set(1);
        }
        this.secondFormGroup.get(['storage'])?.updateValueAndValidity();
      });
  }

  async create() {
    if (this.firstFormGroup.valid && this.secondFormGroup.valid && this.selectedAz()) {
      const firstValues = this.firstFormGroup.value;
      const secondValues = this.secondFormGroup.value;

      const createDisk = new CreateDisk({
        general: {
          productName: firstValues.productName!,
          labels: this.labels(),
          source: {
            type: secondValues.source!.type!,
            url: secondValues.source!.url!,
            clone: secondValues.source!.clone!,
            snapshot: secondValues.source!.snapshot!,
          },
          storage: secondValues.storage!,
          storageClass: secondValues.storageClass!,
        },
      });

      const created = await firstValueFrom(
        this.diskSvc.create(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.selectedAz()!,
          createDisk
        )
      );
      this.router.navigate(['..', 'details', this.selectedAz(), created.eid], { relativeTo: this.route });
    }
  }

  async loadStorageClassList(az: string) {
    const storageClassList = await firstValueFrom(
      this.diskSvc
        .listStorageClass(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, az)
        .pipe(catchError(() => of(null)))
    );
    this.storageClassList.set(storageClassList || []);
  }
  async loadDisks(az: string) {
    const disks = await firstValueFrom(
      this.diskSvc
        .listByAZ(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, az)
        .pipe(catchError(() => of(null)))
    );
    this.disksProduct.set(disks || []);
  }
  async loadSnapshots(az: string) {
    const snapshots = await firstValueFrom(
      this.snapshotSvc
        .listByAZ(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, az)
        .pipe(catchError(() => of(null)))
    );
    this.snapshotsProduct.set(snapshots || []);
  }
}
