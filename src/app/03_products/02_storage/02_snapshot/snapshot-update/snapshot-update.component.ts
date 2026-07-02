import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
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
import { UpdateSnapshot } from '@products/00_shared/models/storage/snapshot/create-snapshot.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { SnapshotService } from '@products/00_shared/services/snapshot.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom, of } from 'rxjs';

@Component({
  selector: 'spx-snapshot-update',
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
  templateUrl: './snapshot-update.component.html',
  styleUrl: './snapshot-update.component.scss',
})
export class SnapshotUpdateComponent {
  protected location = inject(Location);
  protected stateSvc = inject(StateService);
  protected snapshotSvc = inject(SnapshotService);
  protected diskSvc = inject(DiskService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  selectedAz = signal<string>('');
  protected eid;

  labelSelector = signal<string[]>([]);
  initLabels = signal<string[]>([]);

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
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
    const route = inject(ActivatedRoute);
    const permissionSvc = inject(PermissionService);

    this.selectedAz.set(route.snapshot.paramMap.get('az') || '');
    this.eid = route.snapshot.paramMap.get('id') || '';
    if (this.selectedAz() && this.eid && permissionSvc.permissions().includes(PermissionsEnum.ProjectVPCWrite)) {
      this.loadSnapshot();
    } else {
      this.location.back();
    }
  }

  loadSnapshot() {
    this.snapshotSvc
      .get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz(), this.eid)
      .subscribe(res => {
        if (res.snapshotSchedule) {
          this.firstFormGroup.reset({
            az: this.selectedAz(),
            productName: res.productName,
          });

          const schedule = res.snapshotSchedule.spec?.schedule;
          let interval = 1;
          if (schedule) {
            const match = schedule.match(/\*\/(\d+)/);
            interval = parseInt(match ? match[1] : '1');
          }

          const expiryTime = parseInt(res.snapshotSchedule.spec.retention?.expires.match(/\d/g)?.join('') || '1');

          this.secondFormGroup.reset({
            schedule: interval,
            expiryTime: expiryTime,
            paused: res.snapshotSchedule.spec.disabled || false,
          });

          const labels: string[] = [];
          if (res.snapshotSchedule.spec.claimSelector?.matchLabels) {
            Object.entries(res.snapshotSchedule.spec.claimSelector?.matchLabels).forEach(([key, value]) => {
              labels.push(key + ':' + value);
            });
          }
          this.initLabels.set(labels);
        } else {
          this.location.back();
        }
      });
  }

  async update() {
    if (this.selectedAz() && this.firstFormGroup.valid && this.secondFormGroup.valid) {
      const first = this.firstFormGroup.getRawValue();
      const second = this.secondFormGroup.getRawValue();

      const body: UpdateSnapshot = {
        general: {
          productName: first.productName,
        },
        spec: {
          labelSelector: this.labelSelector(),
          schedule: second.schedule,
          retention: {
            expiryTime: second.expiryTime,
          },
          paused: second.paused,
        },
      };

      await firstValueFrom(
        this.snapshotSvc.update(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.selectedAz()!,
          this.eid,
          body
        )
      );
      this.router.navigate(['/products', 'storage', 'snapshot', 'details', this.selectedAz(), this.eid]);
    }
  }
}
