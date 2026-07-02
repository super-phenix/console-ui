import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import {
  CPU_DEFAULT_VALUE,
  CpuValue,
  MEMORY_DEFAULT_VALUE,
  MemoryValue,
} from '@products/00_shared/models/compute/instance/instance';
import {
  controlPlaneNetworkPolicies,
  ControlPlaneNetworkPolicies,
  CreateKaaS,
  CreateKaasControlPlane,
  CreateKaasNetwork,
  CreateKaasNodes,
  KaasPostInstallChart,
  WorkersNetworkPolicies,
  workersNetworkPolicies,
} from '@products/00_shared/models/paas/kaas/kaas';
import { ProductSubnet } from '@products/00_shared/models/product.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { KaasService } from '@products/00_shared/services/kaas.service';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { generateShortId, isVersionAtLeast } from '@products/00_shared/utils/cluster-utils';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { StateService } from '@shared/services/state.service';
import { catchError, firstValueFrom, of } from 'rxjs';
import { KaasCPNetpolHelperDialog } from '../00_shared/dialogs/kaas-cp-netpol-helper-dialog.component';
import { KaasWorkersNetpolHelperDialog } from '../00_shared/dialogs/kaas-workers-netpol-helper-dialog.component';
import { NetworkSelectComponent } from '../00_shared/network-select/network-select.component';
import { NodeGroupFormComponent } from '../00_shared/node-group-form/node-group-form.component';
import { StepKaasEssentialsComponent } from '../00_shared/step-kaas-essentials/step-kaas-essentials.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { StepPostInstallChartComponent } from '../00_shared/step-post-install-chart/step-post-install-chart.component';
import { StepDisasterRecoveryComponent } from '../00_shared/step-disaster-recovery/step-disaster-recovery.component';
import { StepDataStoreComponent } from '../00_shared/step-datastore/step-datastore.component';

@Component({
  selector: 'spx-kaas-create',
  imports: [
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    ContentHeaderComponent,
    StepGeneralComponent,
    NodeGroupFormComponent,
    NetworkSelectComponent,
    MatCheckboxModule,
    StepKaasEssentialsComponent,
    StepPostInstallChartComponent,
    StepDisasterRecoveryComponent,
    StepDataStoreComponent,
  ],
  templateUrl: './kaas-create.component.html',
  styleUrl: './kaas-create.component.scss',
})
export class KaasCreateComponent {
  protected stateSvc = inject(StateService);
  protected kaasSvc = inject(KaasService);
  protected instanceSvc = inject(InstanceService);
  protected diskSvc = inject(DiskService);
  protected subnetSvc = inject(SubnetService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  private fb = inject(FormBuilder);

  readonly MaxNodeGroups = 5;
  readonly controlPlaneNetworkPolicies = controlPlaneNetworkPolicies;
  readonly workersNetworkPolicies = workersNetworkPolicies;

  selectedAz = signal<string | null>(null);

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
    kubeVersion: this.fb.nonNullable.control('', Validators.required),
    advanced: this.fb.nonNullable.control(false, Validators.required),
    cpNetPol: this.fb.nonNullable.control<ControlPlaneNetworkPolicies>('default', Validators.required),
    workersNetPol: this.fb.nonNullable.control<WorkersNetworkPolicies>('default', Validators.required),
  });

  // Disaster Recovery (PRA) toggle + datastore overrides (advanced step). Defaults mirror the sfs-kaas chart.
  disasterRecovery = signal(false);
  dataStoreFormGroup = this.fb.nonNullable.group({
    storageClassName: this.fb.nonNullable.control(''),
    storage: this.fb.nonNullable.control(8, [Validators.required, Validators.min(1)]),
  });

  // Disaster Recovery needs Kubernetes >= 1.35.
  private kubeVersionValue = toSignal(this.firstFormGroup.controls.kubeVersion.valueChanges, { initialValue: '' });
  drSupported = computed(() => isVersionAtLeast(this.kubeVersionValue(), 1, 35));

  secondFormGroup = this.fb.group({
    groups: this.fb.array([this.newNodeGroup(generateShortId(), 3, CPU_DEFAULT_VALUE, MEMORY_DEFAULT_VALUE, '', 10)]),
  });

  postInstallChartActive = signal(false);
  postInstallChartFormGroup = this.fb.group({
    chartName: this.fb.nonNullable.control('', Validators.required),
    chartVersion: this.fb.nonNullable.control('', Validators.required),
    namespace: this.fb.nonNullable.control(''),
    repoUrl: this.fb.nonNullable.control('', Validators.required),
    values: this.fb.nonNullable.control(''),
  });

  // Model-only aggregator used as the Advanced step's stepControl so an invalid datastore
  // blocks navigation the same way an invalid post-install chart does. Never bound as a directive.
  advancedFormGroup = this.fb.group({
    postInstallChart: this.postInstallChartFormGroup,
    dataStore: this.dataStoreFormGroup,
  });

  get groups() {
    return this.secondFormGroup.get('groups') as FormArray;
  }

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
      if (this.selectedAz() !== '' && this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.subnetSvc.listByAZ(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.selectedAz()!
        );
      } else {
        return of([]);
      }
    },
  });

  kubeVersions = rxResource({
    params: () => [this.stateSvc.organization(), this.stateSvc.project()],
    stream: () => {
      if (this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.kaasSvc.getKubeVersions(this.stateSvc.organization()!.id, this.stateSvc.project()!.id);
      } else {
        return of([]);
      }
    },
  });

  networks = Array<CreateKaasNetwork[]>();

  corednsValues = signal('');
  ciliumValues = signal('');
  metricsServerValues = signal('');

  constructor() {
    effect(() => {
      if (this.storageClassList.value().length) {
        this.groups.controls.forEach(group => {
          group.get('storageClass')?.setValue(this.storageClassList.value()[0]);
        });
        if (!this.dataStoreFormGroup.controls.storageClassName.value) {
          this.dataStoreFormGroup.controls.storageClassName.setValue(this.storageClassList.value()[0]);
        }
      }
    });

    // Clear the DR toggle if the selected version stops supporting it.
    effect(() => {
      if (!this.drSupported() && this.disasterRecovery()) {
        this.disasterRecovery.set(false);
      }
    });

    effect(() => {
      if (this.kubeVersions.hasValue() && this.kubeVersions.value()?.length > 0) {
        this.firstFormGroup.get('kubeVersion')?.setValue(this.kubeVersions.value()[0]);
      }
    });

    effect(() => {
      if (this.postInstallChartActive()) {
        this.postInstallChartFormGroup.get('chartName')?.addValidators(Validators.required);
        this.postInstallChartFormGroup.get('chartVersion')?.addValidators(Validators.required);
        this.postInstallChartFormGroup.get('repoUrl')?.addValidators(Validators.required);
      } else {
        this.postInstallChartFormGroup.get('chartName')?.removeValidators(Validators.required);
        this.postInstallChartFormGroup.get('chartVersion')?.removeValidators(Validators.required);
        this.postInstallChartFormGroup.get('repoUrl')?.removeValidators(Validators.required);
      }
      this.postInstallChartFormGroup.get('chartName')?.updateValueAndValidity();
      this.postInstallChartFormGroup.get('chartVersion')?.updateValueAndValidity();
      this.postInstallChartFormGroup.get('repoUrl')?.updateValueAndValidity();
    });
  }

  addNewInstanceGroup() {
    if (this.groups.length < this.MaxNodeGroups) {
      const storageClassDefaultValue = this.storageClassList.value().length ? this.storageClassList.value()[0] : '';
      const name = this.getId();
      this.groups.push(
        this.newNodeGroup(name, 3, CPU_DEFAULT_VALUE, MEMORY_DEFAULT_VALUE, storageClassDefaultValue, 10)
      );
    }
  }

  removeInstanceGroup(index: number) {
    this.groups.removeAt(index);
    this.networks.splice(index, 1);
  }

  updateNetwork(index: number, subnets: ProductSubnet[]) {
    this.networks[index] = subnets.map<CreateKaasNetwork>((v, i) => {
      return {
        order: i,
        id: v.id,
      };
    });
  }

  isNetworkValid() {
    return this.networks.every(v => v.length > 0);
  }

  advancedConfigValid() {
    if (this.firstFormGroup.get('advanced')?.value === true) {
      if (this.postInstallChartActive() && this.postInstallChartFormGroup.invalid) {
        return false;
      }
      if (this.disasterRecovery() && this.dataStoreFormGroup.invalid) {
        return false;
      }
    }
    return true;
  }

  private getId() {
    let id = generateShortId();
    const isTaken = this.groups.controls.some(g => g.get('name')?.value === id);
    if (isTaken) {
      id = this.getId();
      return id;
    } else {
      return id;
    }
  }

  private newNodeGroup(
    name: string,
    replicas: number,
    cpu: CpuValue,
    memory: MemoryValue,
    storageClass: string,
    bootDiskSize: number
  ) {
    return this.fb.group({
      name: this.fb.nonNullable.control(name, Validators.required),
      replicas: this.fb.nonNullable.control(replicas, Validators.required),
      cpu: this.fb.nonNullable.control<CpuValue>(cpu, Validators.required),
      memory: this.fb.nonNullable.control<MemoryValue>(memory, Validators.required),
      storageClass: this.fb.nonNullable.control(storageClass, Validators.required),
      bootDiskSize: this.fb.nonNullable.control(bootDiskSize, Validators.required),
    });
  }

  async create() {
    if (
      this.selectedAz() &&
      this.firstFormGroup.valid &&
      this.secondFormGroup.valid &&
      this.secondFormGroup.value.groups &&
      this.secondFormGroup.value.groups.length > 0 &&
      this.isNetworkValid() &&
      this.advancedConfigValid()
    ) {
      const groups = this.secondFormGroup.value.groups.map<CreateKaasNodes>((v, i) => {
        return {
          name: v.name!,
          replicas: v.replicas!,
          cpu: v.cpu!,
          memory: v.memory!,
          bootDiskSize: v.bootDiskSize!,
          storageClass: v.storageClass!,
          subnets: this.networks[i],
        };
      });

      const advancedConfig = this.firstFormGroup.value.advanced;
      const postInstallChart: KaasPostInstallChart = this.postInstallChartFormGroup.value;
      const controlPlane: CreateKaasControlPlane | undefined = this.disasterRecovery()
        ? {
            dataStore: {
              dedicated: true,
              storageClassName: this.dataStoreFormGroup.value.storageClassName!,
              storage: this.dataStoreFormGroup.value.storage!,
            },
          }
        : undefined;

      const body: CreateKaaS = {
        general: {
          productName: this.firstFormGroup.value.productName!,
        },
        spec: {
          kubeVersion: this.firstFormGroup.value.kubeVersion!,
          cpNetPol: this.firstFormGroup.value.cpNetPol!,
          workersNetPol: this.firstFormGroup.value.workersNetPol!,
          groups: groups,
          kaasEssentials: {
            corednsValues: advancedConfig ? this.corednsValues() : '',
            ciliumValues: advancedConfig ? this.ciliumValues() : '',
            metricsServerValues: advancedConfig ? this.metricsServerValues() : '',
          },
          postInstallChart: advancedConfig && this.postInstallChartActive() ? postInstallChart : undefined,
          controlPlane,
        },
      };

      const created = await firstValueFrom(
        this.kaasSvc.create(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz()!, body)
      );
      this.router.navigate(['..', 'details', this.selectedAz(), created.eid], { relativeTo: this.route });
    }
  }

  openWorkersNetworkPoliciesHelper() {
    this.dialog.open(KaasWorkersNetpolHelperDialog);
  }
  openCPNetworkPoliciesHelper() {
    this.dialog.open(KaasCPNetpolHelperDialog);
  }
}
