import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductListFilterComponent } from '@products/00_shared/components/product-list-filter/product-list-filter.component';
import { InstanceSnapshotActions } from '../instance-snapshot-actions.utils';
import { ProductInstance, ProductSnapshot as ProductInstanceSnapshot } from '@products/00_shared/models/product.model';
import { InstanceSnapshotService } from '@products/00_shared/services/instance-snapshot.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { DEFAULT_REFRESH_INTERVAL, PRA_LABEL_KEYS } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { INSTANCE_SNAPSHOT_REFRESH_KEY, LocalStorageService } from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { catchError, firstValueFrom, of } from 'rxjs';
import { ProductTableWrapperComponent } from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { nonBlockingErrorHandler } from '@shared/http/customHandler';

interface ProductInstanceSnapshotItem {
  data: ProductInstanceSnapshot;
  isPRA: boolean;
}

@Component({
  selector: 'spx-instance-snapshot-list',
  imports: [
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    DatePipe,
    ContentHeaderComponent,
    ProductListFilterComponent,
    ProductTableWrapperComponent,
  ],
  templateUrl: './instance-snapshot-list.component.html',
  styleUrl: './instance-snapshot-list.component.scss',
})
export class InstanceSnapshotListComponent {
  protected readonly userLang = navigator.language;

  protected stateSvc = inject(StateService);
  protected instanceSnapshotSvc = inject(InstanceSnapshotService);
  protected instanceSvc = inject(InstanceService);
  protected permissionSvc = inject(PermissionService);
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected lss = inject(LocalStorageService);

  private readonly dialog = inject(MatDialog);

  readonly INSTANCE_SNAPSHOT_REFRESH_KEY = INSTANCE_SNAPSHOT_REFRESH_KEY;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(INSTANCE_SNAPSHOT_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  canProjectSnapshotWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSnapshotWrite)
  );
  canProjectInstanceWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceWrite)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  displayedColumns: string[] = ['az', 'id', 'name', 'date', 'ready', 'gitops', 'actions'];

  instanceSnapshotProduct;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());
  dataSource = computed(() => {
    const instanceSnapshots = this.instanceSnapshotProduct.value() != null ? this.instanceSnapshotProduct.value()! : [];

    const datas: ProductInstanceSnapshotItem[] = instanceSnapshots.map(i => {
      let isPRA = false;
      if (i.vmSnapshot?.metadata.labels) {
        isPRA = Object.keys(i.vmSnapshot.metadata.labels).some(v => PRA_LABEL_KEYS.includes(v));
      }

      return {
        data: i,
        isPRA: isPRA,
      };
    });
    const dataSource = new MatTableDataSource(datas);
    // Override filterPredicate to use nested object
    dataSource.filterPredicate = this.filterPredicate;
    dataSource.filter = JSON.stringify(this.filterValue(), mapHandlerReplacer);

    return dataSource;
  });

  private needReload = signal(0);

  constructor() {
    const stateSvc = this.stateSvc;
    const instanceSnapshotSvc = this.instanceSnapshotSvc;

    this.instanceSnapshotProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          return instanceSnapshotSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id).pipe(
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

  updateFilter(key: string, value: string) {
    this.filterValue.update(prev => new Map(prev).set(key, value));
  }

  deleteSnapshot(snapshot: ProductInstanceSnapshot) {
    InstanceSnapshotActions.deleteSnapshot(
      this.instanceSnapshotSvc,
      this.stateSvc,
      this.dialog,
      snapshot.codeAZ!,
      snapshot
    ).then(res => {
      if (res) {
        this.reloadData();
      }
    });
  }

  async restoreSnapshot(snapshot: ProductInstanceSnapshot, instanceEid: string, instance?: ProductInstance) {
    if (!instance) {
      instance = await firstValueFrom(
        this.instanceSvc
          .get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, snapshot.codeAZ!, instanceEid)
          .pipe(nonBlockingErrorHandler())
      );
    }

    const instanceName = instance?.productName || undefined;
    const instanceId = instance?.id || undefined;

    InstanceSnapshotActions.restoreSnapshot(
      this.instanceSnapshotSvc,
      this.stateSvc,
      this.dialog,
      this.router,
      snapshot.codeAZ!,
      snapshot,
      instanceName,
      instanceId
    );
  }

  cloneSnapshot(snapshot: ProductInstanceSnapshot) {
    InstanceSnapshotActions.cloneSnapshot(
      this.instanceSnapshotSvc,
      this.stateSvc,
      this.dialog,
      this.router,
      snapshot.codeAZ!,
      snapshot
    );
  }

  openArgoCD(snapshot: ProductInstanceSnapshot) {
    InstanceSnapshotActions.openArgoCD(this.instanceSnapshotSvc, this.stateSvc, snapshot.codeAZ!, snapshot);
  }

  private filterPredicate(item: ProductInstanceSnapshotItem, filter: string) {
    const filterMap = JSON.parse(filter, mapHandlerReviver);
    // If we have a az filter and it doesn't match
    if (filterMap.get('az') && item.data.codeAZ !== filterMap.get('az')) {
      return false;
    }

    // If we have a text filter
    if (filterMap.get('search')) {
      return (
        item.data.productName.toLowerCase().includes(filterMap.get('search')) ||
        item.data.eid.toLowerCase().includes(filterMap.get('search'))
      );
    } else {
      return true;
    }
  }

  reloadData() {
    this.needReload.update(v => v + 1);
  }
}
