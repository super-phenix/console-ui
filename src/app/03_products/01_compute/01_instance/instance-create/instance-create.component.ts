import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
import { AdvancedOptionsInput } from '@products/00_shared/models/compute/instance/advanced-options.model';
import { RunStrategy } from '@products/00_shared/models/compute/instance/enums/run-strategy.enum';
import {
  CPU_DEFAULT_VALUE,
  CPU_VALUE_LIST,
  CpuValue,
  CreateInstance,
  CreateInstanceCloudInit,
  CreateInstanceDisk,
  CreateInstanceNetwork,
  CreateInstanceSsh,
  MEMORY_DEFAULT_VALUE,
  MEMORY_VALUE_LIST,
  MemoryValue,
  VM_TYPE_DEFAULT,
} from '@products/00_shared/models/compute/instance/instance';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { CUSTOM_USER_LABEL_NUMBER, CUSTOM_USER_LABEL_PREFIX } from '@shared/models/consts';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom, of } from 'rxjs';
import { InstanceCreateRunStrategyHelperDialog } from './dialogs/instance-create-run-strategy-helper-dialog.component';
import { InstanceAdvancedCreateComponent } from './instance-advanced-create/instance-advanced-create.component';
import { InstanceNetworkCreateComponent } from './instance-network-create/instance-network-create.component';
import { InstanceSshCreateComponent } from './instance-ssh-create/instance-ssh-create.component';
import { InstanceStorageCreateComponent } from './instance-storage-create/instance-storage-create.component';

@Component({
  selector: 'spx-instance-create',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatStepperModule,
    ContentHeaderComponent,
    StepGeneralComponent,
    StepLabelComponent,
    InstanceNetworkCreateComponent,
    InstanceStorageCreateComponent,
    InstanceSshCreateComponent,
    InstanceAdvancedCreateComponent,
  ],
  templateUrl: './instance-create.component.html',
  styleUrl: './instance-create.component.scss',
})
export class InstanceCreateComponent {
  protected stateSvc = inject(StateService);
  protected instanceSvc = inject(InstanceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private readonly dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  CpuValueList = CPU_VALUE_LIST;
  MemoryValueList = MEMORY_VALUE_LIST;
  RunStrategy = Object.keys(RunStrategy) as RunStrategy[];
  CUSTOM_USER_LABEL_PREFIX = CUSTOM_USER_LABEL_PREFIX;
  CUSTOM_USER_LABEL_NUMBER = CUSTOM_USER_LABEL_NUMBER;

  selectedAz = signal<string | null>(null);

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
  });

  secondFormGroup = this.fb.nonNullable.group({
    runStrategy: this.fb.nonNullable.control(RunStrategy.Manual, Validators.required),
    vmType: this.fb.nonNullable.control(VM_TYPE_DEFAULT, Validators.required),
    cpu: this.fb.nonNullable.control<CpuValue>(CPU_DEFAULT_VALUE, Validators.required),
    memory: this.fb.nonNullable.control<MemoryValue>(MEMORY_DEFAULT_VALUE, Validators.required),
  });

  // Mirror vmType as a signal so the storage step's Driver Disks card reacts
  // immediately (FormControl.value isn't a signal).
  vmTypeSignal = toSignal(this.secondFormGroup.controls.vmType.valueChanges, {
    initialValue: this.secondFormGroup.controls.vmType.value,
  });

  vmTypeList = rxResource({
    params: computed(() => [this.stateSvc.project(), this.stateSvc.organization(), this.selectedAz()]),
    stream: () => {
      const az = this.selectedAz();

      if (az && this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.instanceSvc.listInstanceType(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, az);
      } else {
        return of([]);
      }
    },
  });

  // Advanced options the chosen instance type would apply (seeds the advanced step).
  advancedDefaults = rxResource({
    params: computed(() => ({
      vmType: this.vmTypeSignal(),
      az: this.selectedAz(),
      org: this.stateSvc.organization(),
      project: this.stateSvc.project(),
    })),
    stream: ({ params: { vmType, az, org, project } }) => {
      if (vmType && az && org?.id && project?.id) {
        return this.instanceSvc.getInstanceTypeAdvancedOptions(org.id, project.id, az, vmType);
      }
      return of(undefined);
    },
  });

  networks?: CreateInstanceNetwork[];
  networksValid = true;
  disks?: CreateInstanceDisk[];
  cloudInit?: CreateInstanceCloudInit;
  sshKeys?: CreateInstanceSsh[];
  containerDisks?: string[];
  advanced?: AdvancedOptionsInput;

  labels = signal<string[]>([]);

  async create() {
    if (this.firstFormGroup.valid && this.secondFormGroup.valid && this.selectedAz()) {
      if (!this.networks || this.networks.length <= 0) {
        return;
      }

      const firstValues = this.firstFormGroup.getRawValue();
      const secondValues = this.secondFormGroup.getRawValue();
      const formValue = {
        general: {
          productName: firstValues.productName,
          runStrategy: secondValues.runStrategy,
          vmType: secondValues.vmType,
        },
        compute: {
          cpu: secondValues.cpu,
          memory: secondValues.memory,
        },
      };
      const createInstance = new CreateInstance(formValue);
      createInstance.general.labels = this.labels();
      createInstance.network = this.networks || [];
      createInstance.disks = this.disks || [];
      if (this.cloudInit) {
        createInstance.cloudInit = this.cloudInit;
      } else {
        createInstance.cloudInit = {
          custom: false,
        };
      }

      if (this.sshKeys && this.sshKeys.length > 0) {
        createInstance.sshKeys = this.sshKeys.map(v => v.eid);
      }
      if (this.containerDisks !== undefined) {
        createInstance.containerDisks = this.containerDisks;
      }
      if (this.advanced !== undefined) {
        createInstance.advanced = this.advanced;
      }
      const created = await firstValueFrom(
        this.instanceSvc.create(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.selectedAz()!,
          createInstance
        )
      );
      this.router.navigate(['..', 'details', this.selectedAz(), created.eid], { relativeTo: this.route });
    }
  }

  openRunStrategyHelp() {
    this.dialog.open(InstanceCreateRunStrategyHelperDialog);
  }
}
