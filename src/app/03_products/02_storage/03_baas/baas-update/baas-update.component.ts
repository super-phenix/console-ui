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
import { UpdateBaaS, UpdateBaaSProduct } from '@products/00_shared/models/storage/baas/baas';
import { BaasService } from '@products/00_shared/services/baas.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'spx-baas-update',
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
  templateUrl: './baas-update.component.html',
  styleUrl: './baas-update.component.scss',
})
export class BaasUpdateComponent {
  protected stateSvc = inject(StateService);
  protected baasSvc = inject(BaasService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  protected eid;
  protected name = '';

  selectedAz = signal<string>('');
  isScheduled = signal(false);
  labelSelector = signal<string[]>([]);

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
  });

  secondFormGroup = this.fb.nonNullable.group({
    schedule: this.fb.nonNullable.control(1, [Validators.min(1), Validators.max(7)]),
    expiryTime: this.fb.nonNullable.control(24, [Validators.required, Validators.min(24), Validators.max(960)]),
    paused: this.fb.nonNullable.control(false, Validators.required),
  });

  initLabels = signal<string[]>([]);

  constructor() {
    this.selectedAz.set(this.route.snapshot.paramMap.get('az') || '');
    this.eid = this.route.snapshot.paramMap.get('id') || '';

    if (this.stateSvc.organization() && this.stateSvc.project() && this.eid) {
      this.baasSvc
        .getForUpdate(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz(), this.eid)
        .subscribe(v => {
          this.loadBaaSCluser(v);
        });
    }
  }

  loadBaaSCluser(baas: UpdateBaaSProduct) {
    if (baas && baas.spec) {
      this.name = baas.productName || baas.eid;
      this.firstFormGroup.reset({
        az: this.selectedAz(),
        productName: baas.productName,
      });

      this.initLabels.set(baas.spec.labelSelector || []);
      this.isScheduled.set(baas.spec.scheduled);

      const scheduleCtrl = this.secondFormGroup.controls.schedule;
      if (this.isScheduled()) {
        scheduleCtrl.addValidators(Validators.required);
      } else {
        scheduleCtrl.removeValidators(Validators.required);
      }
      scheduleCtrl.updateValueAndValidity();
      this.secondFormGroup.reset({
        paused: baas.spec.paused,
        expiryTime: baas.spec.retention?.expiryTime,
        schedule: baas.spec.schedule,
      });
    }
  }

  async update() {
    if (this.selectedAz() && this.firstFormGroup.valid && this.secondFormGroup.valid) {
      const first = this.firstFormGroup.getRawValue();
      const second = this.secondFormGroup.getRawValue();

      const body: UpdateBaaS = {
        general: {
          productName: first.productName,
        },
        spec: {
          labelSelector: this.labelSelector(),
        },
      };
      if (this.isScheduled()) {
        body.spec.schedule = second.schedule;
        body.spec.retention = {
          expiryTime: second.expiryTime,
        };
        body.spec.paused = second.paused;
      }

      await firstValueFrom(
        this.baasSvc.update(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.selectedAz()!,
          this.eid,
          body
        )
      );
      this.router.navigate(['/products', 'storage', 'baas', 'details', this.selectedAz(), this.eid]);
    }
  }
}
