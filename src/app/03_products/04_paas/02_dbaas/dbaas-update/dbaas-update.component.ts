import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import {
  DBAAS_CPU_LIST,
  DBAAS_DEFAULT_INSTANCES,
  DBAAS_MAX_INSTANCES,
  DBAAS_MEMORY_LIST,
  DBAAS_MIN_INSTANCES,
  postgresMajor,
  UpdateDBaaS,
  UpdateDBaaSProduct,
} from '@products/00_shared/models/paas/dbaas/dbaas.model';
import { DBaaSService } from '@products/00_shared/services/dbaas.service';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { EMPTY, firstValueFrom, of } from 'rxjs';
import { DBaaSTopologyComponent } from '../00_shared/dbaas-topology/dbaas-topology.component';

@Component({
  selector: 'spx-dbaas-update',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatStepperModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ContentHeaderComponent,
    StepGeneralComponent,
    DBaaSTopologyComponent,
  ],
  templateUrl: './dbaas-update.component.html',
})
export class DBaaSUpdateComponent {
  protected stateSvc = inject(StateService);
  protected dbaasSvc = inject(DBaaSService);
  private subnetSvc = inject(SubnetService);
  private router = inject(Router);

  private readonly dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  readonly CPU_LIST = DBAAS_CPU_LIST;
  readonly MEMORY_LIST = DBAAS_MEMORY_LIST;
  readonly INSTANCE_LIST = Array.from(
    { length: DBAAS_MAX_INSTANCES - DBAAS_MIN_INSTANCES + 1 },
    (_, i) => DBAAS_MIN_INSTANCES + i
  );

  selectedAz = signal<string>('');
  protected eid;

  app = signal<UpdateDBaaSProduct | undefined>(undefined);
  updating = signal(false);

  formGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    version: this.fb.nonNullable.control('', Validators.required),
    instances: this.fb.nonNullable.control(DBAAS_DEFAULT_INSTANCES, [
      Validators.required,
      Validators.min(DBAAS_MIN_INSTANCES),
      Validators.max(DBAAS_MAX_INSTANCES),
    ]),
    cpu: this.fb.nonNullable.control<number>(1, Validators.required),
    memory: this.fb.nonNullable.control<number>(1, Validators.required),
    storage: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    externalAccess: this.fb.nonNullable.control(false),
  });

  instances = toSignal(this.formGroup.controls.instances.valueChanges, { initialValue: DBAAS_DEFAULT_INSTANCES });

  versions = rxResource({
    params: () => [this.stateSvc.organization(), this.stateSvc.project()],
    stream: () => {
      if (this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.dbaasSvc.getPostgresVersions(this.stateSvc.organization()!.id, this.stateSvc.project()!.id);
      } else {
        return of([]);
      }
    },
    defaultValue: [],
  });

  subnet = rxResource({
    params: () => this.app()?.spec.subnetEId,
    stream: ({ params }) =>
      params
        ? this.subnetSvc.get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz(), params)
        : EMPTY,
  });

  // Only minor versions of the current major are accepted; the current one stays selectable even if retired.
  sameMajorVersions = computed(() => {
    const current = this.app()?.spec.version;
    if (!current) {
      return [];
    }
    const major = postgresMajor(current);
    const list = this.versions.value().filter(v => postgresMajor(v) === major);
    return list.includes(current) ? list : [current, ...list];
  });

  constructor() {
    const route = inject(ActivatedRoute);
    const permissionSvc = inject(PermissionService);
    const location = inject(Location);

    this.selectedAz.set(route.snapshot.paramMap.get('az') || '');
    this.eid = route.snapshot.paramMap.get('id') || '';
    if (this.selectedAz() && this.eid && permissionSvc.permissions().includes(PermissionsEnum.ProjectDBaaSWrite)) {
      this.loadApp();
    } else {
      location.back();
    }
  }

  async loadApp() {
    const res = await firstValueFrom(
      this.dbaasSvc.getForUpdate(
        this.stateSvc.organization()!.id,
        this.stateSvc.project()!.id,
        this.selectedAz(),
        this.eid
      )
    );
    this.formGroup.reset({
      productName: res.productName,
      version: res.spec.version,
      instances: res.spec.instances,
      cpu: res.spec.cpu,
      memory: res.spec.memory,
      storage: res.spec.storage,
      externalAccess: res.spec.externalAccess,
    });
    // Storage can only grow
    this.formGroup.controls.storage.setValidators([Validators.required, Validators.min(res.spec.storage)]);
    this.formGroup.controls.storage.updateValueAndValidity();
    this.app.set(res);
  }

  async update() {
    const app = this.app();
    if (!app || this.formGroup.invalid || this.updating()) {
      return;
    }

    const values = this.formGroup.getRawValue();
    // Only these fields roll the instances
    const restarts = (['version', 'instances', 'cpu', 'memory', 'storage'] as const).some(
      key => values[key] !== app.spec[key]
    );
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title: `Update database`,
        html:
          `<p>Apply the changes to "${app.productName}"?</p>` +
          (restarts ? `<p>Instances restart one at a time to pick up new resources or a new version.</p>` : ''),
        confirmBtn: 'Update',
      },
    });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) {
      return;
    }

    const body: UpdateDBaaS = {
      general: { productName: values.productName },
      spec: {
        version: values.version,
        instances: values.instances,
        cpu: values.cpu,
        memory: values.memory,
        storage: values.storage,
        externalAccess: values.externalAccess,
        // Immutable, sent unchanged
        storageClass: app.spec.storageClass,
        subnetEId: app.spec.subnetEId,
        vip: app.spec.vip,
      },
    };

    this.updating.set(true);
    try {
      await firstValueFrom(
        this.dbaasSvc.update(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.selectedAz(),
          this.eid,
          body
        )
      );
      this.router.navigate(['/products', 'paas', 'dbaas', 'details', this.selectedAz(), this.eid]);
    } finally {
      this.updating.set(false);
    }
  }
}
