import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AutoSelectDirective } from '@shared/directives/auto-select.directive';
import { ProductDisk, ProductSnapshot } from '@products/00_shared/models/product.model';
import {
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
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { catchError, firstValueFrom, of } from 'rxjs';

@Component({
  selector: 'spx-disk-create-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    AutoSelectDirective,
    MatChipsModule,
    MatIconModule,
    TitleCasePipe,
  ],
  templateUrl: './disk-create-form.component.html',
  styleUrl: './disk-create-form.component.scss',
})
export class DiskCreateFormComponent implements OnInit {
  protected stateSvc = inject(StateService);
  protected diskSvc = inject(DiskService);
  protected snapshotSvc = inject(SnapshotService);
  protected permissionSvc = inject(PermissionService);

  canProjectDiskRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectDiskRead));
  canProjectSnapshotRead = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSnapshotRead)
  );

  DiskSourceTypes = DiskSourceTypes;
  DiskSourceTypeBlank = DiskSourceTypeBlank;
  az = input<string | null>();
  initName = input<string | null>();
  /**
   * Emit the create form when it changes
   */
  createFormChange = output<FormGroup>();

  private fb = inject(FormBuilder);
  maxLength = MAX_NAME_LENGTH;

  createForm = this.fb.nonNullable.group({
    general: this.fb.group({
      productName: this.fb.nonNullable.control('', Validators.required),
      az: this.fb.nonNullable.control('', Validators.required),
      storage: this.fb.nonNullable.control(10, [Validators.required]),
      source: this.fb.group({
        type: this.fb.nonNullable.control<DiskSourceType>(DiskSourceTypeRegistry, Validators.required),
        url: this.fb.nonNullable.control('', Validators.required),
        clone: this.fb.nonNullable.control<ProductDisk | undefined>(undefined),
        snapshot: this.fb.nonNullable.control<ProductDisk | undefined>(undefined),
      }),
      storageClass: this.fb.nonNullable.control(undefined, [Validators.required]),
    }),
  });

  storageClassList = signal<string[] | undefined>(undefined);
  disksProduct = signal<ProductDisk[] | undefined>(undefined);
  snapshotsProduct = signal<ProductSnapshot[] | undefined>(undefined);

  minStorageSize = signal(1);

  constructor() {
    this.createForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.createFormChange.emit(this.createForm);
    });

    //  Fetch resources when az is selected
    this.createForm
      .get('general.az')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(async val => {
        this.loadStorageClassList(val);

        if (this.canProjectDiskRead()) {
          this.loadDisks(val);
        }

        if (this.canProjectSnapshotRead()) {
          this.loadSnapshots(val);
        }
      });

    //  Update rules depending on source type
    this.createForm
      .get(['general', 'source', 'type'])
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(v => {
        this.createForm.get(['general', 'source', 'url'])?.removeValidators(Validators.required);
        this.createForm.get(['general', 'source', 'clone'])?.removeValidators(Validators.required);
        this.createForm.get(['general', 'source', 'snapshot'])?.removeValidators(Validators.required);
        switch (v) {
          case DiskSourceTypeRegistry:
          case DiskSourceTypeHttp:
            this.createForm.get(['general', 'source', 'url'])?.addValidators(Validators.required);
            break;
          case DiskSourceTypeClone:
            this.createForm.get(['general', 'source', 'clone'])?.addValidators(Validators.required);
            break;
          case DiskSourceTypeSnapshot:
            this.createForm.get(['general', 'source', 'snapshot'])?.addValidators(Validators.required);
            break;
          case DiskSourceTypeBlank:
            break;
        }

        this.createForm.get(['general', 'source', 'url'])?.updateValueAndValidity();
        this.createForm.get(['general', 'source', 'clone'])?.updateValueAndValidity();
        this.createForm.get(['general', 'source', 'snapshot'])?.updateValueAndValidity();
        this.minStorageSize.set(1);
      });

    //  Update min size storage when clone source is selected
    this.createForm
      .get(['general', 'source', 'clone'])
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
        this.createForm.get(['general', 'storage'])?.updateValueAndValidity();
      });

    //  Update min size storage when snapshot source is selected
    this.createForm
      .get(['general', 'source', 'snapshot'])
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
        this.createForm.get(['general', 'storage'])?.updateValueAndValidity();
      });
  }

  ngOnInit() {
    // Init az if present
    if (this.az()) {
      this.createForm.get('general.az')?.setValue(this.az()!);
    }

    if (this.initName()) {
      this.createForm.get('general.productName')?.setValue(this.initName()!);
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
