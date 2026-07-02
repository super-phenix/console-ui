import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { StepLabelComponent } from '@products/00_shared/components/forms-step/step-label/step-label.component';
import { BackupScope, BackupCreateType, CreateBaaS } from '@products/00_shared/models/storage/baas/baas';
import { BaasService } from '@products/00_shared/services/baas.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'spx-baas-create',
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
    MatSlideToggleModule,
    ContentHeaderComponent,
    StepGeneralComponent,
    StepLabelComponent,
  ],
  templateUrl: './baas-create.component.html',
  styleUrl: './baas-create.component.scss',
})
export class BaasCreateComponent {
  protected stateSvc = inject(StateService);
  protected baasSvc = inject(BaasService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  selectedAz = signal<string | null>(null);
  isScheduled = signal(false);
  labelSelector = signal<string[]>([]);

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
    scope: this.fb.nonNullable.control<BackupScope>('all', Validators.required),
    scheduled: this.fb.nonNullable.control<BackupCreateType>('onetime', Validators.required),
  });

  secondFormGroup = this.fb.nonNullable.group({
    schedule: this.fb.nonNullable.control(1, [Validators.min(1), Validators.max(7)]),
    expiryTime: this.fb.nonNullable.control(24, [Validators.required, Validators.min(24), Validators.max(960)]),
    paused: this.fb.nonNullable.control(false, Validators.required),
  });

  constructor() {
    this.firstFormGroup.controls.scheduled.valueChanges.subscribe(scheduled => {
      this.isScheduled.set(scheduled === 'scheduled');
      const scheduleCtrl = this.secondFormGroup.controls.schedule;

      if (this.isScheduled()) {
        scheduleCtrl.addValidators(Validators.required);
      } else {
        scheduleCtrl.removeValidators(Validators.required);
      }
      scheduleCtrl.updateValueAndValidity();
    });
  }

  async create() {
    if (this.selectedAz() && this.firstFormGroup.valid && this.secondFormGroup.valid) {
      const first = this.firstFormGroup.getRawValue();
      const second = this.secondFormGroup.getRawValue();

      const body: CreateBaaS = {
        general: {
          productName: first.productName,
        },
        spec: {
          labelSelector: this.labelSelector(),
          scheduled: false,
          type: first.scope,
        },
      };
      if (this.isScheduled()) {
        body.spec.scheduled = true;
        body.spec.schedule = second.schedule;
        body.spec.retention = {
          expiryTime: second.expiryTime,
        };
        body.spec.paused = second.paused;
      }

      const created = await firstValueFrom(
        this.baasSvc.create(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz()!, body)
      );
      this.router.navigate(['..', 'details', this.selectedAz(), created.eid], { relativeTo: this.route });
    }
  }
}
