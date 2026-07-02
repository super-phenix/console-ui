import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductListFilterComponent } from '@products/00_shared/components/product-list-filter/product-list-filter.component';
import { ProductSnapshot } from '@products/00_shared/models/product.model';
import { SnapshotService } from '@products/00_shared/services/snapshot.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { DEFAULT_REFRESH_INTERVAL, PRA_LABEL_KEYS } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { SNAPSHOT_REFRESH_KEY, LocalStorageService } from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { catchError, of } from 'rxjs';
import { ProductTableWrapperComponent } from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';
import { SnapshotActions } from '../snapshot-actions.utils';
import { MatDividerModule } from '@angular/material/divider';

interface ProductSnapshotItem {
  data: ProductSnapshot;
  isPRA: boolean;
}

@Component({
  selector: 'spx-snapshot-list',
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
  templateUrl: './snapshot-list.component.html',
  styleUrl: './snapshot-list.component.scss',
})
export class SnapshotListComponent {
  protected readonly userLang = navigator.language;

  protected stateSvc = inject(StateService);
  protected snapshotSvc = inject(SnapshotService);
  protected permissionSvc = inject(PermissionService);
  protected route = inject(ActivatedRoute);
  protected router = inject(Router);
  protected lss = inject(LocalStorageService);

  protected readonly dialog = inject(MatDialog);

  readonly SNAPSHOT_REFRESH_KEY = SNAPSHOT_REFRESH_KEY;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(SNAPSHOT_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  canProjectSnapshotWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSnapshotWrite)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  displayedColumns: string[] = ['az', 'id', 'name', 'date', 'status', 'gitops', 'actions'];

  snapshotProduct;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());
  dataSource = computed(() => {
    const snapshots = this.snapshotProduct.hasValue() ? this.snapshotProduct.value()! : [];

    const datas: ProductSnapshotItem[] = snapshots.map(i => {
      let isPRA = false;
      if (i.snapshot?.metadata.labels) {
        isPRA = Object.keys(i.snapshot.metadata.labels).some(v => PRA_LABEL_KEYS.includes(v));
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
    const snapshotSvc = this.snapshotSvc;

    this.snapshotProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          return snapshotSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id).pipe(
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

  openArgoCD(snapshot: ProductSnapshot) {
    SnapshotActions.openArgoCD(this.snapshotSvc, this.stateSvc, snapshot);
  }

  deleteSnapshot(snapshot: ProductSnapshot) {
    SnapshotActions.deleteSnapshot(this.snapshotSvc, this.stateSvc, this.dialog, snapshot).then(res => {
      if (res) {
        this.reloadData();
      }
    });
  }

  private filterPredicate(item: ProductSnapshotItem, filter: string) {
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
