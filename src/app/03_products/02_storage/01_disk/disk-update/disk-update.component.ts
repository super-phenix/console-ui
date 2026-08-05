import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { StepLabelComponent } from '@products/00_shared/components/forms-step/step-label/step-label.component';
import { ProductDisk } from '@products/00_shared/models/product.model';
import { UpdateDisk } from '@products/00_shared/models/storage/disk/create-disk.model';
import { AZService } from '@products/00_shared/services/az.service';
import { DiskService } from '@products/00_shared/services/disk.service';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { CUSTOM_USER_LABEL_NUMBER, CUSTOM_USER_LABEL_PREFIX, MAX_NAME_LENGTH } from '@shared/models/consts';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'spx-disk-update',
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
    ContentHeaderComponent,
    BannerComponent,
  ],
  templateUrl: './disk-update.component.html',
  styleUrl: './disk-update.component.scss',
})
export class DiskUpdateComponent {
  protected stateSvc = inject(StateService);
  protected diskSvc = inject(DiskService);
  protected azSvc = inject(AZService);
  protected location = inject(Location);
  private router = inject(Router);

  private readonly dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  maxLength = MAX_NAME_LENGTH;
  readonly CUSTOM_USER_LABEL_PREFIX = CUSTOM_USER_LABEL_PREFIX;
  readonly CUSTOM_USER_LABEL_NUMBER = CUSTOM_USER_LABEL_NUMBER;
  readonly BannerLevelEnum = BannerLevelEnum;

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    storage: this.fb.nonNullable.control(10, Validators.required),
  });

  selectedAz = signal<string>('');
  protected eid;

  disk = signal<ProductDisk | undefined>(undefined);
  oldSize = signal(1);

  /**
   * TODO: to remove when gitops can grow disk size
   * A GitOps managed disk can only be resized only by forcing the update on the API side.
   */
  isGitops = computed(() => this.disk()?.gitops === 'true');

  labels = signal<string[]>([]);
  initLabels = signal<string[]>([]);

  constructor() {
    const route = inject(ActivatedRoute);
    const permissionSvc = inject(PermissionService);
    const location = inject(Location);

    this.selectedAz.set(route.snapshot.paramMap.get('az') || '');
    this.eid = route.snapshot.paramMap.get('id') || '';
    if (this.selectedAz() && this.eid && permissionSvc.permissions().includes(PermissionsEnum.ProjectDiskWrite)) {
      this.loadDisk();
    } else {
      location.back();
    }
  }

  loadDisk() {
    this.diskSvc
      .get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz(), this.eid)
      .subscribe(res => {
        const storage =
          res?.pvc?.status?.capacity?.storage || res?.disk?.spec?.storage?.resources?.requests?.['storage'];
        const size = storage ? storage.replace(/\D/g, '') : '10';

        if (res.pvc?.metadata.labels) {
          const customLabels: string[] = [];
          for (const [key, value] of Object.entries(res.pvc.metadata.labels)) {
            const label = `${key}:${value}`;
            if (label.startsWith(CUSTOM_USER_LABEL_PREFIX)) {
              customLabels.push(label);
            }
          }
          this.initLabels.set(customLabels);
          this.labels.set(customLabels);
        }

        this.oldSize.set(+size);

        this.firstFormGroup.reset({
          productName: res.productName,
          storage: +size,
        });

        this.disk.set(res);

        if (res.gitops === 'true') {
          this.firstFormGroup.controls.productName.disable();
        }
      });
  }

  async update() {
    if (this.firstFormGroup.valid && this.selectedAz()) {
      const ref = this.dialog.open(ConfirmDialog, {
        data: {
          title: `Disk Update`,
          html: this.isGitops()
            ? `
            <p>Are you sure you want to resize "${this.disk()!.productName}"?</p>
            <span class="color-warn">
              <strong>Warning:</strong> this disk is managed by GitOps. The new size will be applied directly to the
              cluster, bypassing the GitOps protection. You must update the git manifest accordingly, otherwise the
              next synchronization will revert this change.
            </span>`
            : `
            <span>Are you sure you want to update "${this.disk()!.productName}"?</span>`,
        },
      });
      ref.afterClosed().subscribe(async res => {
        if (!res) {
          return;
        }
        // getRawValue and not value: productName is disabled for a GitOps disk and would be dropped
        const formValues = this.firstFormGroup.getRawValue();
        const updateDisk: UpdateDisk = {
          general: {
            productName: formValues.productName,
            // The label step is hidden for a GitOps disk, resend the loaded labels untouched
            labels: this.isGitops() ? this.initLabels() : this.labels(),
            storage: formValues.storage.toString(),
          },
        };

        await firstValueFrom(
          this.diskSvc.update(
            this.stateSvc.organization()!.id,
            this.stateSvc.project()!.id,
            this.selectedAz(),
            this.eid,
            updateDisk,
            this.isGitops()
          )
        );
        this.router.navigate(['/products', 'storage', 'disk', 'details', this.selectedAz(), this.eid]);
      });
    }
  }
}
