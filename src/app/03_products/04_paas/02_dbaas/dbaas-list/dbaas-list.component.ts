import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ProductListFilterComponent } from '@products/00_shared/components/product-list-filter/product-list-filter.component';
import {
  defaultSortFunc,
  ProductTableWrapperComponent,
} from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';
import { postgresVersionFromImage } from '@products/00_shared/models/paas/dbaas/dbaas.model';
import { ProductDBaaS } from '@products/00_shared/models/product.model';
import { DBaaSService } from '@products/00_shared/services/dbaas.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { DEFAULT_REFRESH_INTERVAL } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { DBAAS_REFRESH_KEY, LocalStorageService } from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { of } from 'rxjs';
import { DBaaSActions, dbaasPhaseChip } from '../dbaas-actions.utils';

interface ProductDBaaSItem {
  data: ProductDBaaS;
}

@Component({
  selector: 'spx-dbaas-list',
  imports: [
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    ContentHeaderComponent,
    ProductListFilterComponent,
    ProductTableWrapperComponent,
  ],
  templateUrl: './dbaas-list.component.html',
})
export class DBaaSListComponent {
  protected stateSvc = inject(StateService);
  protected dbaasSvc = inject(DBaaSService);
  protected permissionSvc = inject(PermissionService);
  protected lss = inject(LocalStorageService);

  private readonly dialog = inject(MatDialog);

  readonly DBAAS_REFRESH_KEY = DBAAS_REFRESH_KEY;

  readonly dbaasPhaseChip = dbaasPhaseChip;
  readonly postgresVersionFromImage = postgresVersionFromImage;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(DBAAS_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  canProjectDBaaSWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectDBaaSWrite));
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  displayedColumns: string[] = ['az', 'id', 'name', 'version', 'instances', 'size', 'phase', 'gitops', 'actions'];

  // Extends the wrapper's default az/name/id sort with the database-specific columns.
  readonly dbaasSortFunc = (sort: Sort, a: ProductDBaaSItem, b: ProductDBaaSItem): number => {
    const dir = sort.direction === 'asc' ? 1 : -1;
    switch (sort.active) {
      case 'version':
        return (
          (postgresVersionFromImage(a.data.cluster?.spec?.imageName) || '').localeCompare(
            postgresVersionFromImage(b.data.cluster?.spec?.imageName) || '',
            undefined,
            { numeric: true }
          ) * dir
        );
      case 'instances':
        return ((a.data.cluster?.spec?.instances || 0) - (b.data.cluster?.spec?.instances || 0)) * dir;
      case 'phase':
        return dbaasPhaseChip(a.data.cluster).label.localeCompare(dbaasPhaseChip(b.data.cluster).label) * dir;
      default:
        return defaultSortFunc(sort, a, b);
    }
  };

  dbaasProduct;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());

  dataSource = computed(() => {
    const dbs = this.dbaasProduct.hasValue() ? this.dbaasProduct.value()! : [];

    const datas: ProductDBaaSItem[] = dbs.map(i => ({ data: i }));
    const dataSource = new MatTableDataSource(datas);
    // Override filterPredicate to use nested object
    dataSource.filterPredicate = this.filterPredicate;
    dataSource.filter = JSON.stringify(this.filterValue(), mapHandlerReplacer);

    return dataSource;
  });

  private needReload = signal(0);

  constructor() {
    const stateSvc = this.stateSvc;
    const dbaasSvc = this.dbaasSvc;

    this.dbaasProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          // errors intentionally propagate so the resource reports 'error' and the
          // template renders the failure state instead of an endless spinner
          return dbaasSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id);
        } else {
          return of([]);
        }
      },
    });
  }

  deleteDBaaS(db: ProductDBaaS) {
    DBaaSActions.deleteDBaaS(this.dbaasSvc, this.stateSvc, this.dialog, db.codeAZ!, db).then(res => {
      if (res) {
        this.reloadData();
      }
    });
  }

  restartDBaaS(db: ProductDBaaS) {
    DBaaSActions.restartDBaaS(this.dbaasSvc, this.stateSvc, this.dialog, db.codeAZ!, db).then(res => {
      if (res) {
        this.reloadData();
      }
    });
  }

  openArgoCD(db: ProductDBaaS) {
    DBaaSActions.openArgoCD(this.dbaasSvc, this.stateSvc, db.codeAZ!, db);
  }

  private filterPredicate(item: ProductDBaaSItem, filter: string) {
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
