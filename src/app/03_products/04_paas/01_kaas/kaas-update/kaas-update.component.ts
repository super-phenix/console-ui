import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AutoSelectDirective } from '@shared/directives/auto-select.directive';
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
  CreateKaasControlPlane,
  CreateKaasNetwork,
  CreateKaasNodes,
  KaasPostInstallChart,
  UpdateKaaS,
  UpdateKaaSProduct,
  workersNetworkPolicies,
  WorkersNetworkPolicies,
} from '@products/00_shared/models/paas/kaas/kaas';
import { ProductSubnet } from '@products/00_shared/models/product.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { KaasService } from '@products/00_shared/services/kaas.service';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { generateShortId, isVersionAtLeast } from '@products/00_shared/utils/cluster-utils';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { StateService } from '@shared/services/state.service';
import { catchError, firstValueFrom, of } from 'rxjs';
import { KaasCPNetpolHelperDialog } from '../00_shared/dialogs/kaas-cp-netpol-helper-dialog.component';
import { KaasWorkersNetpolHelperDialog } from '../00_shared/dialogs/kaas-workers-netpol-helper-dialog.component';
import { NetworkSelectComponent } from '../00_shared/network-select/network-select.component';
import { NodeGroupFormComponent } from '../00_shared/node-group-form/node-group-form.component';
import { StepKaasEssentialsComponent } from '../00_shared/step-kaas-essentials/step-kaas-essentials.component';
import { StepPostInstallChartComponent } from '../00_shared/step-post-install-chart/step-post-install-chart.component';
import { StepDisasterRecoveryComponent } from '../00_shared/step-disaster-recovery/step-disaster-recovery.component';
import { StepDataStoreComponent } from '../00_shared/step-datastore/step-datastore.component';
import { isEmpty } from '@shared/utils/utils';

@Component({
  selector: 'spx-kaas-update',
  imports: [
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    AutoSelectDirective,
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
  templateUrl: './kaas-update.component.html',
  styleUrl: './kaas-update.component.scss',
})
export class KaasUpdateComponent {
  protected stateSvc = inject(StateService);
  protected kaasSvc = inject(KaasService);
  protected instanceSvc = inject(InstanceService);
  protected diskSvc = inject(DiskService);
  protected subnetSvc = inject(SubnetService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  private fb = inject(FormBuilder);
  protected eid;
  protected name = '';

  readonly MaxNodeGroups = 5;
  readonly controlPlaneNetworkPolicies = controlPlaneNetworkPolicies;
  readonly workersNetworkPolicies = workersNetworkPolicies;

  selectedAz = signal<string>('');

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
    advanced: this.fb.nonNullable.control(false, Validators.required),
    kubeVersion: this.fb.nonNullable.control('', Validators.required),
    cpNetPol: this.fb.nonNullable.control<ControlPlaneNetworkPolicies>('default', Validators.required),
    workersNetPol: this.fb.nonNullable.control<WorkersNetworkPolicies>('default', Validators.required),
  });

  // Disaster Recovery (PRA) toggle + datastore overrides (advanced step). Defaults mirror the sfs-kaas chart.
  disasterRecovery = signal(false);
  // Original values used to detect changes that Kamaji cannot handle simultaneously.
  private originalKubeVersion = signal('');
  private originalDisasterRecovery = signal(false);
  // Current DR storage size when editing; the input cannot be reduced below it.
  originalStorage = signal(1);
  dataStoreFormGroup = this.fb.nonNullable.group({
    storageClassName: this.fb.nonNullable.control(''),
    storage: this.fb.nonNullable.control(8, [Validators.required, Validators.min(1)]),
  });

  // Disaster Recovery needs Kubernetes >= 1.35.
  private kubeVersionValue = toSignal(this.firstFormGroup.controls.kubeVersion.valueChanges, { initialValue: '' });
  protected drSupported = computed(() => isVersionAtLeast(this.kubeVersionValue(), 1, 35));

  // Kamaji limitation: cannot change the dedicated datastore and the kube version at the same time.
  private kubeVersionChanged = computed(() => {
    const original = this.originalKubeVersion();
    return original !== '' && this.kubeVersionValue() !== original;
  });
  protected drDisabled = computed(() => !this.drSupported() || this.kubeVersionChanged());
  protected drDisabledTooltip = computed(() => {
    if (!this.drSupported()) return 'Requires Kubernetes 1.35+';
    if (this.kubeVersionChanged()) return 'Cannot change the dedicated datastore when the Kubernetes version is also changed';
    return '';
  });

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

  storageClassList = signal<string[]>([]);
  subnets = signal<ProductSubnet[]>([]);
  kubeVersions = signal<string[]>([]);

  initNetworkList = Array<string[]>();
  networks = Array<CreateKaasNetwork[]>();

  corednsValues = signal('');
  ciliumValues = signal('');
  metricsServerValues = signal('');

  constructor() {
    this.selectedAz.set(this.route.snapshot.paramMap.get('az') || '');
    this.eid = this.route.snapshot.paramMap.get('id') || '';

    if (this.stateSvc.organization() && this.stateSvc.project()) {
      this.loadStatics();
    }

    if (this.stateSvc.organization() && this.stateSvc.project() && this.eid) {
      this.kaasSvc
        .getForUpdate(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz(), this.eid)
        .subscribe(v => {
          this.loadKaaSCluser(v);
        });
    }

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

    // Clear the DR toggle if the selected version stops supporting it.
    // Reset DR to its original value when the kube version changes (Kamaji limitation).
    effect(() => {
      if (!this.drSupported() && this.disasterRecovery()) {
        this.disasterRecovery.set(false);
      } else if (this.kubeVersionChanged()) {
        this.disasterRecovery.set(this.originalDisasterRecovery());
      }
    });
  }

  loadStatics() {
    firstValueFrom(
      this.diskSvc
        .listStorageClass(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz()!)
        .pipe(catchError(() => of<string[]>([])))
    ).then(v => this.storageClassList.set(v));

    firstValueFrom(
      this.subnetSvc.listByAZ(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz()!)
    ).then(v => this.subnets.set(v));

    firstValueFrom(this.kaasSvc.getKubeVersions(this.stateSvc.organization()!.id, this.stateSvc.project()!.id)).then(
      v => this.kubeVersions.set(v)
    );
  }

  loadKaaSCluser(kaas: UpdateKaaSProduct) {
    this.name = kaas.productName || kaas.eid;

    // Check advanced configuration
    let advancedConfiguration = false;
    if (kaas.spec?.kaasEssentials?.corednsValues) {
      advancedConfiguration = true;
      this.corednsValues.set(kaas.spec?.kaasEssentials?.corednsValues);
    }

    if (kaas.spec?.kaasEssentials?.ciliumValues) {
      advancedConfiguration = true;

      this.ciliumValues.set(kaas.spec?.kaasEssentials?.ciliumValues);
    }
    if (kaas.spec?.kaasEssentials?.metricsServerValues) {
      advancedConfiguration = true;
      this.metricsServerValues.set(kaas.spec?.kaasEssentials?.metricsServerValues);
    }

    if (kaas.spec?.postInstallChart && !isEmpty(kaas.spec.postInstallChart)) {
      advancedConfiguration = true;
      this.postInstallChartActive.set(true);
      this.postInstallChartFormGroup.reset(kaas.spec.postInstallChart);
    }

    const dataStore = kaas.spec?.controlPlane?.dataStore;
    if (dataStore?.dedicated) {
      const current = dataStore.storage ?? 8;
      this.originalStorage.set(current);
      this.dataStoreFormGroup.patchValue({
        storageClassName: dataStore.storageClassName ?? '',
        storage: current,
      });
      // PVC-backed storage cannot be shrunk: forbid going below the current size.
      this.dataStoreFormGroup.controls.storage.setValidators([Validators.required, Validators.min(current)]);
      this.dataStoreFormGroup.controls.storage.updateValueAndValidity();
    }
    this.disasterRecovery.set(!!dataStore?.dedicated);
    this.originalDisasterRecovery.set(!!dataStore?.dedicated);

    this.firstFormGroup.reset({
      az: this.selectedAz(),
      kubeVersion: kaas.spec?.kubeVersion,
      advanced: advancedConfiguration,
      cpNetPol: kaas.spec?.cpNetPol,
      workersNetPol: kaas.spec?.workersNetPol,
      productName: kaas.productName,
    });

    this.originalKubeVersion.set(kaas.spec?.kubeVersion ?? '');

    this.groups.controls = [];
    const groups = kaas.spec?.groups.sort((a, b) => a.name.localeCompare(b.name)) || [];
    groups.forEach((el, i) => {
      this.groups.push(this.newNodeGroup(el.name, el.replicas, el.cpu, el.memory, el.storageClass, el.bootDiskSize));
      this.initNetworkList[i] = el.subnets.map(s => s.id);
    });
  }

  addNewInstanceGroup() {
    if (this.groups.length < this.MaxNodeGroups) {
      const storageClassDefaultValue = this.storageClassList().length ? this.storageClassList()[0] : '';
      const name = this.getId();
      this.groups.push(
        this.newNodeGroup(name, 3, CPU_DEFAULT_VALUE, MEMORY_DEFAULT_VALUE, storageClassDefaultValue, 10)
      );
    }
  }

  removeInstanceGroup(index: number) {
    this.groups.removeAt(index);
    // if the use remove a group we need to remove the initial value to avoid overlap between forms
    this.initNetworkList.splice(index, 1);
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

  async update() {
    if (
      this.selectedAz() &&
      this.firstFormGroup.valid &&
      this.secondFormGroup.valid &&
      this.secondFormGroup.value.groups &&
      this.secondFormGroup.value.groups.length > 0 &&
      this.isNetworkValid()
    ) {
      const ref = this.dialog.open(ConfirmDialog, {
        data: {
          title: `Update cluster`,
          content: `Are you sure you want to update "${this.name}" ?`,
        },
      });

      ref.afterClosed().subscribe(async res => {
        if (!res) {
          return;
        }

        const groups = this.secondFormGroup.value.groups!.map<CreateKaasNodes>((v, i) => {
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

        const body: UpdateKaaS = {
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

        await firstValueFrom(
          this.kaasSvc.update(
            this.stateSvc.organization()!.id,
            this.stateSvc.project()!.id,
            this.selectedAz()!,
            this.eid,
            body
          )
        );
        this.router.navigate(['/products', 'paas', 'kaas', 'details', this.selectedAz(), this.eid]);
      });
    }
  }

  openWorkersNetworkPoliciesHelper() {
    this.dialog.open(KaasWorkersNetpolHelperDialog);
  }
  openCPNetworkPoliciesHelper() {
    this.dialog.open(KaasCPNetpolHelperDialog);
  }
}
