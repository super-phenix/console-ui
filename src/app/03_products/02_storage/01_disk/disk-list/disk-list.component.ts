import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DiskActions } from '../disk-actions.utils';
import { ProductListFilterComponent } from '@products/00_shared/components/product-list-filter/product-list-filter.component';
import { ProductDisk } from '@products/00_shared/models/product.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { DEFAULT_REFRESH_INTERVAL, PRA_LABEL_KEYS } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { DISK_REFRESH_KEY, DISK_SHOW_CLUSTER_KEY, LocalStorageService } from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { catchError, of } from 'rxjs';
import { ProductTableWrapperComponent } from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';
import { isClusterResource } from '@products/00_shared/utils/cluster-utils';

interface ProductDiskItem {
  data: ProductDisk;
  isPRA: boolean;
  isClusterDisk: boolean;
}

@Component({
  selector: 'spx-disk-list',
  imports: [
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatSlideToggleModule,
    ContentHeaderComponent,
    ProductListFilterComponent,
    ProductTableWrapperComponent,
  ],
  templateUrl: './disk-list.component.html',
  styleUrl: './disk-list.component.scss',
})
export class DiskListComponent {
  protected stateSvc = inject(StateService);
  protected diskSvc = inject(DiskService);
  protected permissionSvc = inject(PermissionService);
  protected route = inject(ActivatedRoute);
  protected lss = inject(LocalStorageService);
  protected router = inject(Router);

  private readonly dialog = inject(MatDialog);

  readonly DISK_SHOW_CLUSTER_KEY = DISK_SHOW_CLUSTER_KEY;
  readonly DISK_REFRESH_KEY = DISK_REFRESH_KEY;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(DISK_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  canProjectDiskWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectDiskWrite));
  canProjectSnapshotWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSnapshotWrite)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  displayedColumns: string[] = ['az', 'id', 'name', 'size', 'type', 'mountStatus', 'progress', 'gitops', 'actions'];

  diskProduct;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());
  showClusterDisk = computed<boolean>(() => {
    const val = this.lss.getValue(DISK_SHOW_CLUSTER_KEY)();
    return val != null ? val === 'true' : true;
  });

  dataSource = computed(() => {
    const disks = this.diskProduct.hasValue() ? this.diskProduct.value()! : [];

    const datas: ProductDiskItem[] = disks.map(i => {
      let isPRA = false;
      if (i.pvc?.metadata.labels) {
        isPRA = Object.keys(i.pvc.metadata.labels).some(v => PRA_LABEL_KEYS.includes(v));
      }

      const isCluster = isClusterResource(i.pvc?.metadata.labels);

      return {
        data: i,
        isPRA: isPRA,
        isClusterDisk: isCluster,
      };
    });
    const dataSource = new MatTableDataSource(datas);
    // Override filterPredicate to use nested object
    dataSource.filterPredicate = this.filterPredicate;
    const filter = this.filterValue().set('showClusterDisk', this.showClusterDisk() ? 'true' : 'false');
    dataSource.filter = JSON.stringify(filter, mapHandlerReplacer);

    return dataSource;
  });


  private needReload = signal(0);

  constructor() {
    const stateSvc = this.stateSvc;
    const diskSvc = this.diskSvc;

    this.diskProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          return diskSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id).pipe(
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

  deleteDisk(disk: ProductDisk) {
    DiskActions.deleteDisk(this.diskSvc, this.stateSvc, this.dialog, disk.codeAZ!, disk).then(res => {
      if (res) {
        this.reloadData();
      }
    });
  }

  createSnapshot(disk: ProductDisk) {
    DiskActions.createSnapshot(this.router, disk.codeAZ!, disk);
  }

  openArgoCD(disk: ProductDisk) {
    DiskActions.openArgoCD(this.diskSvc, this.stateSvc, disk.codeAZ!, disk);
  }

  private filterPredicate(item: ProductDiskItem, filter: string) {
    const filterMap = JSON.parse(filter, mapHandlerReviver);
    // If we have a az filter and it doesn't match
    if (filterMap.get('az') && item.data.codeAZ !== filterMap.get('az')) {
      return false;
    }

    if (filterMap.get('showClusterDisk') != 'true' && item.isClusterDisk) {
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

  isInError(el: ProductDisk) {
    return el?.disk?.status.conditions?.find(c => c.type === 'Running')?.reason === 'Error';
  }

  reloadData() {
    this.needReload.update(v => v + 1);
  }
}
