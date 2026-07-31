import { Component, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AutoSelectDirective } from '@shared/directives/auto-select.directive';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { StepLabelComponent } from '@products/00_shared/components/forms-step/step-label/step-label.component';
import { CreateSnapshot } from '@products/00_shared/models/storage/snapshot/create-snapshot.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { SnapshotService } from '@products/00_shared/services/snapshot.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom, of } from 'rxjs';

@Component({
  selector: 'spx-snapshot-create',
  imports: [
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    AutoSelectDirective,
    MatSlideToggleModule,
    ContentHeaderComponent,
    StepGeneralComponent,
    StepLabelComponent,
  ],
  templateUrl: './snapshot-create.component.html',
  styleUrl: './snapshot-create.component.scss',
})
export class SnapshotCreateComponent {
  protected stateSvc = inject(StateService);
  protected snapshotSvc = inject(SnapshotService);
  protected diskSvc = inject(DiskService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  diskEid = this.route.snapshot.queryParamMap.get('diskEid') ?? '';
  az = this.route.snapshot.queryParamMap.get('az') ?? '';

  selectedAz = signal<string | null>(null);
  labelSelector = signal<string[]>([]);

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control(this.az, Validators.required),
    source: this.fb.nonNullable.control<string>(this.diskEid, Validators.required),
    scheduled: this.fb.nonNullable.control<boolean>(false, Validators.required),
  });

  secondFormGroup = this.fb.nonNullable.group({
    schedule: this.fb.nonNullable.control(1, [Validators.min(1), Validators.max(7)]),
    expiryTime: this.fb.nonNullable.control(24, [Validators.required, Validators.min(24), Validators.max(960)]),
    paused: this.fb.nonNullable.control(false, Validators.required),
  });

  diskProduct = rxResource({
    params: () => this.selectedAz(),
    stream: () => {
      if (this.selectedAz() && this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.diskSvc.listByAZ(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz()!);
      } else {
        return of([]);
      }
    },
  });

  constructor() {
    if (this.az) {
      this.selectedAz.set(this.az);
    }

    this.firstFormGroup
      .get('source')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(v => {
        if (v && v !== '') {
          const diskExist = this.diskProduct.hasValue()
            ? this.diskProduct.value().findIndex(item => item.eid === v)
            : -1;
          if (diskExist === -1) {
            this.firstFormGroup.get('source')?.setValue('');
          }
        }
      });

    this.firstFormGroup
      .get('scheduled')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(v => {
        if (v) {
          this.firstFormGroup.get('source')?.removeValidators(Validators.required);
        } else {
          this.firstFormGroup.get('source')?.addValidators(Validators.required);
        }
        this.firstFormGroup.get('source')?.updateValueAndValidity();
      });
  }

  async create() {
    if (this.selectedAz() && this.firstFormGroup.valid) {
      const first = this.firstFormGroup.getRawValue();

      const body: CreateSnapshot = {
        general: {
          productName: first.productName,
        },
        spec: {
          scheduled: false,
        },
      };

      if (first.scheduled) {
        // second form need to be valid if the snapshot is scheduled
        if (this.secondFormGroup.valid) {
          const second = this.secondFormGroup.getRawValue();

          body.spec.scheduled = true;
          body.spec.schedule = second.schedule;

          body.spec.retention = {
            expiryTime: second.expiryTime,
          };
          body.spec.paused = second.paused;
          body.spec.labelSelector = this.labelSelector();
        } else {
          return;
        }
      } else {
        body.spec.source = first.source;
      }

      const created = await firstValueFrom(
        this.snapshotSvc.create(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz()!, body)
      );
      this.router.navigate(['..', 'details', this.selectedAz(), created.eid], { relativeTo: this.route });
    }
  }
}
