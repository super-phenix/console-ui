import { TitleCasePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { S3Config } from '@products/00_shared/models/storage/bucket/bucket.model';
import { BucketConfig, CreateBucket } from '@products/00_shared/models/storage/bucket/create-bucket.model';
import { BucketService } from '@products/00_shared/services/bucket.service';
import { BINARY_UNITS, BinaryUnit, parseQuantityToBytes } from '@products/00_shared/utils/quantity';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { StateService } from '@shared/services/state.service';
import { jsonValidator } from '@shared/utils/validators';
import { catchError, firstValueFrom, of } from 'rxjs';
import { JsonConfigFieldComponent } from '../00_shared/json-config-field/json-config-field.component';

@Component({
  selector: 'spx-bucket-create',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ContentHeaderComponent,
    StepGeneralComponent,
    JsonConfigFieldComponent,
    TitleCasePipe,
  ],
  templateUrl: './bucket-create.component.html',
  styleUrl: './bucket-create.component.scss',
})
export class BucketCreateComponent {
  protected stateSvc = inject(StateService);
  protected bucketSvc = inject(BucketService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  readonly BINARY_UNITS = BINARY_UNITS;

  s3Config = signal<S3Config | undefined>(undefined);
  selectedAz = signal<string | null>(null);
  submitting = signal(false);

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
  });

  secondFormGroup = this.fb.nonNullable.group(
    {
      storageClass: this.fb.nonNullable.control<string | undefined>(undefined, [Validators.required]),
      maxObjects: this.fb.control<number | null>(null, [Validators.min(1)]),
      maxSizeValue: this.fb.control<number | null>(null, [Validators.min(1)]),
      maxSizeUnit: this.fb.nonNullable.control<BinaryUnit>('Gi'),
      policy: this.fb.nonNullable.control('', [jsonValidator()]),
      lifecycle: this.fb.nonNullable.control('', [jsonValidator()]),
    },
    { validators: [this.maxSizeCapValidator()] }
  );

  constructor() {
    effect(() => {
      const az = this.selectedAz();
      if (az) {
        this.loadS3Config(az);
      }
    });
  }

  async loadS3Config(az: string) {
    const s3Config = await firstValueFrom(
      this.bucketSvc
        .getS3Config(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, az)
        .pipe(catchError(() => of(null)))
    );
    this.s3Config.set(s3Config || undefined);

    const maxObjectsCtrl = this.secondFormGroup.get('maxObjects');
    maxObjectsCtrl?.setValidators([Validators.min(1), ...(s3Config ? [Validators.max(s3Config.maxBucketObjects)] : [])]);
    maxObjectsCtrl?.updateValueAndValidity();
    this.secondFormGroup.updateValueAndValidity();
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
    const values = this.secondFormGroup.getRawValue();
    return {
      maxObjects: values.maxObjects ?? undefined,
      maxSize: values.maxSizeValue ? `${values.maxSizeValue}${values.maxSizeUnit}` : undefined,
      policy: values.policy || undefined,
      lifecycle: values.lifecycle || undefined,
    };
  }

  async create() {
    if (this.submitting() || !this.firstFormGroup.valid || !this.secondFormGroup.valid || !this.selectedAz()) {
      return;
    }

    const firstValues = this.firstFormGroup.value;
    const secondValues = this.secondFormGroup.getRawValue();

    const createBucket = new CreateBucket({
      general: {
        productName: firstValues.productName!,
        storageClass: secondValues.storageClass!,
        config: this.buildConfig(),
      },
    });

    this.submitting.set(true);
    try {
      const created = await firstValueFrom(
        this.bucketSvc.create(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.selectedAz()!,
          createBucket
        )
      );
      this.router.navigate(['..', 'details', this.selectedAz(), created.eid], { relativeTo: this.route });
    } catch (err) {
      console.error(err);
      this.submitting.set(false);
    }
  }
}
