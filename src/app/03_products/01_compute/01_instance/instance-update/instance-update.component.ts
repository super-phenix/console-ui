import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AutoSelectDirective } from '@shared/directives/auto-select.directive';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { StepLabelComponent } from '@products/00_shared/components/forms-step/step-label/step-label.component';
import { RunStrategy } from '@products/00_shared/models/compute/instance/enums/run-strategy.enum';
import {
  BUS_AUTO,
  CPU_DEFAULT_VALUE,
  CPU_VALUE_LIST,
  CpuValue,
  CreateInstanceCloudInit,
  CreateInstanceDisk,
  CreateInstanceNetwork,
  CreateInstanceSsh,
  DEFAULT_CLOUD_INIT,
  MEMORY_DEFAULT_VALUE,
  MEMORY_VALUE_LIST,
  MemoryValue,
  NETWORK_MODEL_AUTO,
  UpdateInstance,
  VM_TYPE_DEFAULT,
} from '@products/00_shared/models/compute/instance/instance';
import { extractVolumeEID } from '@products/00_shared/models/compute/instance/utils';
import { AdvancedOptions, AdvancedOptionsInput } from '@products/00_shared/models/compute/instance/advanced-options.model';
import { ProductInstance } from '@products/00_shared/models/product.model';
import { AZService } from '@products/00_shared/services/az.service';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { CUSTOM_USER_LABEL_NUMBER, CUSTOM_USER_LABEL_PREFIX, MAX_NAME_LENGTH } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom, of } from 'rxjs';
import { InstanceCreateRunStrategyHelperDialog } from '../instance-create/dialogs/instance-create-run-strategy-helper-dialog.component';
import { InstanceAdvancedCreateComponent } from '../instance-create/instance-advanced-create/instance-advanced-create.component';
import { InstanceNetworkCreateComponent } from '../instance-create/instance-network-create/instance-network-create.component';
import { InstanceSshCreateComponent } from '../instance-create/instance-ssh-create/instance-ssh-create.component';
import { InstanceStorageCreateComponent } from '../instance-create/instance-storage-create/instance-storage-create.component';

@Component({
  selector: 'spx-instance-update',
  imports: [
    InstanceStorageCreateComponent,
    InstanceSshCreateComponent,
    InstanceNetworkCreateComponent,
    InstanceAdvancedCreateComponent,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule,
    AutoSelectDirective,
    ContentHeaderComponent,
    MatIconModule,
    MatButtonModule,
    MatStepperModule,
    StepGeneralComponent,
    StepLabelComponent,
  ],
  templateUrl: './instance-update.component.html',
  styleUrl: './instance-update.component.scss',
})
export class InstanceUpdateComponent {
  protected stateSvc = inject(StateService);
  protected instanceSvc = inject(InstanceService);
  protected azSvc = inject(AZService);
  protected location = inject(Location);
  private router = inject(Router);

  private readonly dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  CpuValueList = CPU_VALUE_LIST;
  MemoryValueList = MEMORY_VALUE_LIST;
  maxLength = MAX_NAME_LENGTH;
  RunStrategy = Object.keys(RunStrategy) as RunStrategy[];
  CUSTOM_USER_LABEL_PREFIX = CUSTOM_USER_LABEL_PREFIX;
  CUSTOM_USER_LABEL_NUMBER = CUSTOM_USER_LABEL_NUMBER;

  protected eid;

  selectedAz = signal<string>('');
  labels = signal<string[]>([]);
  initLabels = signal<string[]>([]);
  isLabelValid = signal<boolean>(true);

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

  // Mirror vmType as a signal so the storage step's Driver Disks filter reacts
  // immediately (FormControl.value isn't a signal).
  vmTypeSignal = toSignal(this.secondFormGroup.controls.vmType.valueChanges, {
    initialValue: this.secondFormGroup.controls.vmType.value,
  });

  networks?: CreateInstanceNetwork[];
  networksValid = true;
  disks?: CreateInstanceDisk[];
  disksLoaded = signal(false);
  cloudInit?: CreateInstanceCloudInit;
  sshKeys?: CreateInstanceSsh[];
  containerDisks?: string[];
  advanced?: AdvancedOptionsInput;
  advancedInitial = signal<AdvancedOptions | undefined>(undefined);

  // Initial values
  initDisks: CreateInstanceDisk[] = [];
  initCloudInit: CreateInstanceCloudInit | undefined;
  initNetwork: CreateInstanceNetwork[] = [];
  initSshKeys: string[] = [];
  initContainerDisks: string[] = [];

  instance = signal<ProductInstance | undefined>(undefined);

  instanceIsStopped = computed(() => {
    if (this.instance()) {
      const instance = this.instance()!;
      const status =
        (instance.vmi && instance.vmi?.status?.phase
          ? instance.vmi!.status.phase
          : instance.vm?.status?.printableStatus) || 'unknown';
      return status === 'Stopped' || status === 'Succeeded';
    } else {
      return false;
    }
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

  // Defaults of the selected instance type, reactive on vmType so the advanced
  // step's "Auto" hints follow a type change.
  instanceTypeAdvancedDefaults = rxResource({
    params: computed(() => ({
      vmType: this.vmTypeSignal(),
      az: this.selectedAz(),
      org: this.stateSvc.organization(),
      project: this.stateSvc.project(),
    })),
    stream: ({ params: { vmType, az, org, project } }) =>
      vmType && az && org?.id && project?.id
        ? this.instanceSvc.getInstanceTypeAdvancedOptions(org.id, project.id, az, vmType)
        : of(undefined),
  });

  constructor() {
    const route = inject(ActivatedRoute);
    const permissionSvc = inject(PermissionService);
    const location = inject(Location);

    this.selectedAz.set(route.snapshot.paramMap.get('az') || '');
    this.eid = route.snapshot.paramMap.get('id') || '';
    if (this.selectedAz() && this.eid && permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceWrite)) {
      this.loadInstance();
    } else {
      location.back();
    }
  }

  loadInstance() {
    this.instanceSvc
      .get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz(), this.eid)
      .subscribe(res => {
        if (res.vm) {
          const runStrategy = res.vm.spec.runStrategy || RunStrategy.Manual;
          const cpu = res.vm.spec.template?.spec.domain.cpu?.cores || 1;
          const memory = parseInt(res.vm.spec.template?.spec.domain.memory?.guest || '1');

          this.firstFormGroup.reset({
            productName: res.productName,
            az: this.selectedAz(),
          });
          this.secondFormGroup.reset({
            runStrategy: runStrategy as RunStrategy,
            vmType: res.vm.spec.preference?.name || VM_TYPE_DEFAULT,
            cpu: cpu as CpuValue,
            memory: memory as MemoryValue,
          });

          if (res.vm.metadata.labels) {
            const customLabels: string[] = [];
            for (const [key, value] of Object.entries(res.vm.metadata.labels)) {
              const label = `${key}:${value}`;
              if (label.startsWith(CUSTOM_USER_LABEL_PREFIX)) {
                customLabels.push(label);
              }
            }
            this.initLabels.set(customLabels);
          }

          let cloudInit: string | undefined = '';
          const volumes = res.vm?.spec?.template?.spec?.volumes;
          if (res.cloudInit) {
            cloudInit = res.cloudInit;
          } else {
            // Try to fetch old cloud init
            const cloudInitVolume = volumes?.find(v => v.name === 'cloud-init');
            if (cloudInitVolume) {
              cloudInit = cloudInitVolume.cloudInitNoCloud?.userData;
            }
          }

          let cloudInitBus: string = BUS_AUTO;
          const diskList = res.vm?.spec?.template?.spec?.domain?.devices.disks;
          const disks: CreateInstanceDisk[] = [];
          let counter = 0;
          if (diskList) {
            diskList.forEach(d => {
              if (d.name !== 'cloud-init') {
                const volume = volumes?.find(v => v.name === d.name);
                disks.push({
                  order: counter,
                  cdrom: !!d.cdrom,
                  bus: d.disk?.bus || BUS_AUTO,
                  eid: volume ? extractVolumeEID(volume) : d.name,
                });
                counter++;
              } else {
                cloudInitBus = d.disk?.bus || BUS_AUTO;
              }
            });
          }

          this.initDisks = disks;
          this.initCloudInit = {
            config: cloudInit,
            bus: cloudInitBus,
            custom: cloudInit !== DEFAULT_CLOUD_INIT,
          };

          const networkList: CreateInstanceNetwork[] = [];
          const netInterface = res.vm.spec.template?.spec.domain.devices.interfaces;
          res.vm.spec.template?.spec.networks.forEach((v, i) => {
            const subnetEid = v.multus?.networkName.replace(`spx-${this.stateSvc.project()!.id}/`, '');
            if (subnetEid) {
              const annotation = `${subnetEid}.spx-${this.stateSvc.project()!.id}.ovn.kubernetes.io/ip_address`;
              const ip_address = res.vm?.spec.template?.metadata.annotations?.[annotation];

              const network: CreateInstanceNetwork = {
                order: i,
                model: NETWORK_MODEL_AUTO,
                subnetEId: subnetEid,
              };

              if (ip_address) {
                const ips = this.parseIp(ip_address);
                network.ipv4 = ips.v4;
                network.ipv6 = ips.v6;
              }
              if (netInterface && netInterface[i]) {
                network.model = netInterface[i].model || NETWORK_MODEL_AUTO;
              }

              networkList.push(network);
            }
          });

          this.initNetwork = networkList;

          const sshKeys = res.vm.spec.template?.spec.accessCredentials?.map(
            v => v.sshPublicKey.source.secret.secretName
          );

          this.initSshKeys = sshKeys || [];

          this.initContainerDisks = res.containerDisks ?? [];
          this.containerDisks = [...this.initContainerDisks];
        }

        this.instance.set(res);

        // Load the resolved advanced options to seed the advanced step.
        this.instanceSvc
          .getAdvancedOptions(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz(), this.eid)
          .subscribe(advanced => this.advancedInitial.set(advanced));
      });
  }

  async update() {
    if (this.firstFormGroup.valid && this.secondFormGroup.valid) {
      const ref = this.dialog.open(ConfirmDialog, {
        data: {
          title: `Instance Update`,
          html: `
          <span>Are you sure you want to update "${this.instance()!.productName}"?</span>
          <br><br>
          <span><strong>Warning: </strong><i>The update will only take effect after restarting the instance!</i></span>`,
        },
      });
      ref.afterClosed().subscribe(async res => {
        if (!res) {
          return;
        }
        // if no network added, then return immediatly
        if (!this.networks || (this.networks && this.networks.length <= 0)) {
          return;
        }

        const firstValues = this.firstFormGroup.getRawValue();
        const secondValues = this.secondFormGroup.getRawValue();
        const updateInstance: UpdateInstance = {
          general: {
            productName: firstValues.productName,
            runStrategy: secondValues.runStrategy,
            vmType: secondValues.vmType,
          },
          compute: {
            cpu: secondValues.cpu,
            memory: secondValues.memory,
          },
          network: this.networks,
          disks: this.disks,
        };

        updateInstance.general.labels = this.labels();
        updateInstance.cloudInit = this.cloudInit;

        if (this.sshKeys && this.sshKeys.length > 0) {
          updateInstance.sshKeys = this.sshKeys.map(v => v.eid);
        }

        if (this.containerDisks !== undefined) {
          updateInstance.containerDisks = this.containerDisks;
        }

        if (this.advanced !== undefined) {
          updateInstance.advanced = this.advanced;
        }

        await firstValueFrom(
          this.instanceSvc.update(
            this.stateSvc.organization()!.id,
            this.stateSvc.project()!.id,
            this.selectedAz(),
            this.eid,
            updateInstance
          )
        );
        this.router.navigate(['/products', 'compute', 'instance', 'details', this.selectedAz(), this.eid]);
      });
    }
  }

  openRunStrategyHelp() {
    this.dialog.open(InstanceCreateRunStrategyHelperDialog);
  }

  private parseIp(ip: string): { v4?: string; v6?: string } {
    const ips = ip.split(',');
    // dual
    if (ips.length === 2) {
      return { v4: ips[0], v6: ips[1] };
    } else {
      if (ip.includes(':')) {
        return { v6: ip };
      } else {
        return { v4: ip };
      }
    }
  }
}
