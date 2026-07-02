import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductListFilterComponent } from '@products/00_shared/components/product-list-filter/product-list-filter.component';
import { ProductInstance } from '@products/00_shared/models/product.model';
import { AZService } from '@products/00_shared/services/az.service';
import { InstanceSnapshotService } from '@products/00_shared/services/instance-snapshot.service';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { isClusterResource } from '@products/00_shared/utils/cluster-utils';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { DEFAULT_REFRESH_INTERVAL, PRA_LABEL_KEYS } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import {
  INSTANCE_REFRESH_KEY,
  INSTANCE_SHOW_CLUSTER_KEY,
  LocalStorageService,
} from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { catchError, of } from 'rxjs';
import { ProductTableWrapperComponent } from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';
import { InstanceActions } from '../instance-actions.utils';

interface ProductInstanceItem {
  data: ProductInstance;
  isPRA: boolean;
  isClusterInstance: boolean;
}

@Component({
  selector: 'spx-instance-list',
  imports: [
    MatSlideToggleModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatInputModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    ContentHeaderComponent,
    ProductListFilterComponent,
    ProductTableWrapperComponent,
  ],
  templateUrl: './instance-list.component.html',
  styleUrl: './instance-list.component.scss',
})
export class InstanceListComponent {
  protected stateSvc = inject(StateService);
  protected instanceSvc = inject(InstanceService);
  protected azSvc = inject(AZService);
  protected permissionSvc = inject(PermissionService);
  protected instanceSnapshotSvc = inject(InstanceSnapshotService);
  protected route = inject(ActivatedRoute);
  protected lss = inject(LocalStorageService);
  protected clipboard = inject(Clipboard);

  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);

  readonly INSTANCE_SHOW_CLUSTER_KEY = INSTANCE_SHOW_CLUSTER_KEY;
  readonly INSTANCE_REFRESH_KEY = INSTANCE_REFRESH_KEY;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(INSTANCE_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  canProjectInstanceControl = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceControl)
  );
  canProjectInstanceTerminal = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceTerminal)
  );
  canProjectInstanceWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceWrite)
  );
  canProjectSnapshotWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSnapshotWrite)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  displayedColumns: string[] = ['az', 'id', 'name', 'ip', 'status', 'gitops', 'actions'];

  instanceResource;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());
  showClusterInstance = computed<boolean>(() => {
    const val = this.lss.getValue(INSTANCE_SHOW_CLUSTER_KEY)();
    return val != null ? val === 'true' : true;
  });

  dataSource = computed(() => {
    const instances = this.instanceResource.hasValue() ? this.instanceResource.value()! : [];
    const datas: ProductInstanceItem[] = instances.map(i => {
      let isPRA = false;
      if (i.vm?.metadata.labels) {
        isPRA = Object.keys(i.vm.metadata.labels).some(v => PRA_LABEL_KEYS.includes(v));
      }

      const isCluster = isClusterResource(i.vm?.metadata.labels);

      return {
        data: i,
        isPRA: isPRA,
        isClusterInstance: isCluster,
      };
    });
    const dataSource = new MatTableDataSource(datas);
    // Override filterPredicate to use nested object
    dataSource.filterPredicate = this.filterPredicate;
    const filter = this.filterValue().set('showClusterInstance', this.showClusterInstance() ? 'true' : 'false');
    dataSource.filter = JSON.stringify(filter, mapHandlerReplacer);

    return dataSource;
  });

  protected needReload = signal(0);

  constructor() {
    const stateSvc = this.stateSvc;
    const instanceSvc = this.instanceSvc;

    this.instanceResource = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          return instanceSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id).pipe(
            catchError(err => {
              console.error(err);
              return of();
            })
          );
        } else {
          return of([]);
        }
      },
    });
  }

  start(instance: ProductInstance) {
    InstanceActions.startInstance(this.instanceSvc, this.stateSvc, instance.codeAZ!, instance).then(() =>
      this.reloadData()
    );
  }

  stop(instance: ProductInstance) {
    InstanceActions.stopInstance(this.instanceSvc, this.stateSvc, instance.codeAZ!, instance).then(() =>
      this.reloadData()
    );
  }

  stopForce(instance: ProductInstance) {
    InstanceActions.stopForceInstance(this.instanceSvc, this.stateSvc, instance.codeAZ!, instance).then(() =>
      this.reloadData()
    );
  }

  restart(instance: ProductInstance) {
    InstanceActions.restartInstance(this.instanceSvc, this.stateSvc, instance.codeAZ!, instance).then(() =>
      this.reloadData()
    );
  }

  deleteVM(instance: ProductInstance) {
    InstanceActions.deleteInstance(this.instanceSvc, this.stateSvc, this.dialog, instance.codeAZ!, instance).then(
      res => {
        if (res) {
          this.reloadData();
        }
      }
    );
  }

  openSerial(product: ProductInstance) {
    InstanceActions.openSerial(this.stateSvc, product.codeAZ!, product);
  }

  openVNC(product: ProductInstance) {
    InstanceActions.openVNC(this.stateSvc, product.codeAZ!, product);
  }

  createSnapshot(instance: ProductInstance) {
    InstanceActions.createSnapshot(
      this.instanceSnapshotSvc,
      this.stateSvc,
      this.dialog,
      this.snackbar,
      instance.codeAZ!,
      instance
    );
  }

  async openArgoCD(instance: ProductInstance) {
    InstanceActions.openArgoCD(this.instanceSvc, this.stateSvc, instance.codeAZ!, instance);
  }

  private filterPredicate(item: ProductInstanceItem, filter: string) {
    const filterMap = JSON.parse(filter, mapHandlerReviver);
    // If we have a az filter and it doesn't match
    if (filterMap.get('az') && item.data.codeAZ !== filterMap.get('az')) {
      return false;
    }

    if (filterMap.get('showClusterInstance') != 'true' && item.isClusterInstance) {
      return false;
    }

    // If we have a text filter
    if (filterMap.get('search')) {
      // If vm not present, do not exclude the line
      let statusFilter = item.data.vm?.status.printableStatus.toLocaleLowerCase().includes(filterMap.get('search'));
      if (statusFilter === undefined) {
        statusFilter = true;
      }
      return (
        item.data.productName.toLowerCase().includes(filterMap.get('search')) ||
        item.data.eid.toLowerCase().includes(filterMap.get('search')) ||
        statusFilter
      );
    } else {
      return true;
    }
  }

  reloadData() {
    this.needReload.update(v => v + 1);
  }
}
