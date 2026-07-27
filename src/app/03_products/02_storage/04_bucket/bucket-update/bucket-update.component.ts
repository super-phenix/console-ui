import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { JsonConfigFieldComponent } from '../00_shared/json-config-field/json-config-field.component';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { ProductBucket } from '@products/00_shared/models/product.model';
import { S3Config } from '@products/00_shared/models/storage/bucket/bucket.model';
import { BucketConfig, UpdateBucket } from '@products/00_shared/models/storage/bucket/create-bucket.model';
import { BucketService } from '@products/00_shared/services/bucket.service';
import { BINARY_UNITS, BinaryUnit, parseQuantityToBytes, splitQuantity } from '@products/00_shared/utils/quantity';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { jsonValidator } from '@shared/utils/validators';
import { catchError, firstValueFrom, of } from 'rxjs';

@Component({
  selector: 'spx-bucket-update',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    MatIconModule,
    ContentHeaderComponent,
    StepGeneralComponent,
    JsonConfigFieldComponent,
  ],
  templateUrl: './bucket-update.component.html',
  styleUrl: './bucket-update.component.scss',
})
export class BucketUpdateComponent {
  protected stateSvc = inject(StateService);
  protected bucketSvc = inject(BucketService);
  protected location = inject(Location);
  private router = inject(Router);

  private readonly dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  readonly BINARY_UNITS = BINARY_UNITS;

  selectedAz = signal<string>('');
  protected eid;

  bucket = signal<ProductBucket | undefined>(undefined);
  s3Config = signal<S3Config | undefined>(undefined);

  firstFormGroup = this.fb.nonNullable.group(
    {
      productName: this.fb.nonNullable.control('', Validators.required),
      maxObjects: this.fb.control<number | null>(null, [Validators.min(1)]),
      maxSizeValue: this.fb.control<number | null>(null, [Validators.min(1)]),
      maxSizeUnit: this.fb.nonNullable.control<BinaryUnit>('Gi'),
      policy: this.fb.nonNullable.control('', [jsonValidator()]),
      lifecycle: this.fb.nonNullable.control('', [jsonValidator()]),
    },
    { validators: [this.maxSizeCapValidator()] }
  );

  constructor() {
    const route = inject(ActivatedRoute);
    const permissionSvc = inject(PermissionService);
    const location = inject(Location);

    this.selectedAz.set(route.snapshot.paramMap.get('az') || '');
    this.eid = route.snapshot.paramMap.get('id') || '';
    if (this.selectedAz() && this.eid && permissionSvc.permissions().includes(PermissionsEnum.ProjectBucketWrite)) {
      this.loadBucket();
      this.loadS3Config();
    } else {
      location.back();
    }
  }

  loadBucket() {
    this.bucketSvc
      .get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz(), this.eid)
      .subscribe(res => {
        const size = res.bucket?.maxSize ? splitQuantity(res.bucket.maxSize) : null;

        this.firstFormGroup.reset({
          productName: res.productName,
          maxObjects: res.bucket?.maxObjects ? +res.bucket.maxObjects : null,
          maxSizeValue: size?.value ?? null,
          maxSizeUnit: size?.unit ?? 'Gi',
          policy: res.bucket?.policy || '',
          lifecycle: res.bucket?.lifecycle || '',
        });

        this.bucket.set(res);
      });
  }

  async loadS3Config() {
    const s3Config = await firstValueFrom(
      this.bucketSvc
        .getS3Config(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz())
        .pipe(catchError(() => of(null)))
    );
    this.s3Config.set(s3Config || undefined);

    const maxObjectsCtrl = this.firstFormGroup.get('maxObjects');
    maxObjectsCtrl?.setValidators([Validators.min(1), ...(s3Config ? [Validators.max(s3Config.maxBucketObjects)] : [])]);
    maxObjectsCtrl?.updateValueAndValidity();
    this.firstFormGroup.updateValueAndValidity();
  }

  // The composed maxSize quantity must stay within the AZ cap from s3-config.
  private maxSizeCapValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const value = group.get('maxSizeValue')?.value;
      const unit = group.get('maxSizeUnit')?.value;
      const cap = this.s3Config()?.maxBucketSize;
      if (!value || !unit || !cap) {
        return null;
      }
      const sizeBytes = parseQuantityToBytes(`${value}${unit}`);
      const capBytes = parseQuantityToBytes(cap);
      if (sizeBytes === null || capBytes === null) {
        return null;
      }
      return sizeBytes > capBytes ? { maxSizeCap: { max: cap } } : null;
    };
  }

  buildConfig(): BucketConfig {
    const values = this.firstFormGroup.getRawValue();
    return {
      maxObjects: values.maxObjects ?? undefined,
      maxSize: values.maxSizeValue ? `${values.maxSizeValue}${values.maxSizeUnit}` : undefined,
      policy: values.policy || undefined,
      lifecycle: values.lifecycle || undefined,
    };
  }

  async update() {
    if (this.firstFormGroup.valid && this.selectedAz()) {
      const ref = this.dialog.open(ConfirmDialog, {
        data: {
          title: `Bucket Update`,
          html: `<p>Are you sure you want to update "${this.bucket()!.productName}"?</p>`,
        },
      });
      ref.afterClosed().subscribe(async res => {
        if (!res) {
          return;
        }
        const formValues = this.firstFormGroup.getRawValue();
        const updateBucket: UpdateBucket = {
          general: {
            productName: formValues.productName,
            config: this.buildConfig(),
          },
        };

        await firstValueFrom(
          this.bucketSvc.update(
            this.stateSvc.organization()!.id,
            this.stateSvc.project()!.id,
            this.selectedAz(),
            this.eid,
            updateBucket
          )
        );
        this.router.navigate(['/products', 'storage', 'bucket', 'details', this.selectedAz(), this.eid]);
      });
    }
  }
}
