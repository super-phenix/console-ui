import { Component, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import {
  CreateDBaaS,
  DBAAS_CPU_LIST,
  DBAAS_DEFAULT_CPU,
  DBAAS_DEFAULT_INSTANCES,
  DBAAS_DEFAULT_MEMORY,
  DBAAS_DEFAULT_STORAGE,
  DBAAS_MAX_INSTANCES,
  DBAAS_MEMORY_LIST,
  DBAAS_MIN_INSTANCES,
} from '@products/00_shared/models/paas/dbaas/dbaas.model';
import { DBaaSService } from '@products/00_shared/services/dbaas.service';
import { DiskService } from '@products/00_shared/services/disk.service';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { GenerateRandomVirtualIp } from '@products/00_shared/utils/ip';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { AutoSelectDirective } from '@shared/directives/auto-select.directive';
import { VIRTUAL_IP_RANGE } from '@shared/models/consts';
import { StateService } from '@shared/services/state.service';
import { catchError, firstValueFrom, of } from 'rxjs';
import { DBaaSTopologyComponent } from '../00_shared/dbaas-topology/dbaas-topology.component';
import { virtualIpValidator } from '../00_shared/dbaas-validators';

@Component({
  selector: 'spx-dbaas-create',
  imports: [
    MatStepperModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    AutoSelectDirective,
    ContentHeaderComponent,
    StepGeneralComponent,
    DBaaSTopologyComponent,
  ],
  templateUrl: './dbaas-create.component.html',
})
export class DBaaSCreateComponent {
  protected stateSvc = inject(StateService);
  protected dbaasSvc = inject(DBaaSService);
  protected diskSvc = inject(DiskService);
  protected subnetSvc = inject(SubnetService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  readonly CPU_LIST = DBAAS_CPU_LIST;
  readonly MEMORY_LIST = DBAAS_MEMORY_LIST;
  readonly INSTANCE_LIST = Array.from(
    { length: DBAAS_MAX_INSTANCES - DBAAS_MIN_INSTANCES + 1 },
    (_, i) => DBAAS_MIN_INSTANCES + i
  );
  readonly VIRTUAL_IP_RANGE = VIRTUAL_IP_RANGE;

  selectedAz = signal<string | null>(null);
  creating = signal(false);

  generalFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
    version: this.fb.nonNullable.control('', Validators.required),
  });

  sizingFormGroup = this.fb.nonNullable.group({
    instances: this.fb.nonNullable.control(DBAAS_DEFAULT_INSTANCES, [
      Validators.required,
      Validators.min(DBAAS_MIN_INSTANCES),
      Validators.max(DBAAS_MAX_INSTANCES),
    ]),
    cpu: this.fb.nonNullable.control<number>(DBAAS_DEFAULT_CPU, Validators.required),
    memory: this.fb.nonNullable.control<number>(DBAAS_DEFAULT_MEMORY, Validators.required),
    storage: this.fb.nonNullable.control(DBAAS_DEFAULT_STORAGE, [Validators.required, Validators.min(1)]),
    storageClass: this.fb.nonNullable.control('', Validators.required),
  });

  networkFormGroup = this.fb.nonNullable.group({
    subnetEId: this.fb.nonNullable.control('', Validators.required),
    vip: this.fb.nonNullable.control(GenerateRandomVirtualIp(), [Validators.required, virtualIpValidator()]),
    externalAccess: this.fb.nonNullable.control(false),
  });

  // Mirrored into a signal so the topology preview follows the toggle in zoneless mode
  instances = toSignal(this.sizingFormGroup.controls.instances.valueChanges, {
    initialValue: DBAAS_DEFAULT_INSTANCES,
  });

  versions = rxResource({
    params: () => [this.stateSvc.organization(), this.stateSvc.project()],
    stream: () => {
      if (this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.dbaasSvc.getPostgresVersions(this.stateSvc.organization()!.id, this.stateSvc.project()!.id);
      } else {
        return of([]);
      }
    },
  });

  storageClassList = rxResource({
    params: () => this.selectedAz(),
    stream: () => {
      if (this.selectedAz()) {
        return this.diskSvc
          .listStorageClass(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz()!)
          .pipe(catchError(() => of<string[]>([])));
      } else {
        return of([]);
      }
    },
    defaultValue: [],
  });

  subnetsProduct = rxResource({
    params: () => this.selectedAz(),
    stream: () => {
      if (this.selectedAz() && this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.subnetSvc.listByAZ(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.selectedAz()!
        );
      } else {
        return of([]);
      }
    },
    defaultValue: [],
  });

  constructor() {
    // The API lists versions newest first
    effect(() => {
      const versions = this.versions.hasValue() ? this.versions.value() : [];
      if (versions.length && !this.generalFormGroup.controls.version.value) {
        this.generalFormGroup.controls.version.setValue(versions[0]);
      }
    });

    // Storage classes and subnets are per AZ: reset the choice when the AZ changes
    effect(() => {
      const classes = this.storageClassList.value();
      this.sizingFormGroup.controls.storageClass.setValue(classes.length ? classes[0] : '');
    });

    effect(() => {
      this.selectedAz();
      this.networkFormGroup.controls.subnetEId.setValue('');
    });
  }

  regenerateVip() {
    this.networkFormGroup.controls.vip.setValue(GenerateRandomVirtualIp());
  }

  async create() {
    if (
      !this.selectedAz() ||
      this.creating() ||
      this.generalFormGroup.invalid ||
      this.sizingFormGroup.invalid ||
      this.networkFormGroup.invalid
    ) {
      return;
    }

    const general = this.generalFormGroup.getRawValue();
    const body = new CreateDBaaS({
      general: { productName: general.productName },
      spec: {
        version: general.version,
        ...this.sizingFormGroup.getRawValue(),
        ...this.networkFormGroup.getRawValue(),
      },
    });

    this.creating.set(true);
    try {
      const created = await firstValueFrom(
        this.dbaasSvc.create(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz()!, body)
      );
      this.router.navigate(['..', 'details', this.selectedAz(), created.eid], { relativeTo: this.route });
    } finally {
      this.creating.set(false);
    }
  }
}
