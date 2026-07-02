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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductListFilterComponent } from '@products/00_shared/components/product-list-filter/product-list-filter.component';
import { ProductTableWrapperComponent } from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';
import { ProductBaaS } from '@products/00_shared/models/product.model';
import { BaasService } from '@products/00_shared/services/baas.service';
import { getBackupScope, getBackupType, getLastBackup } from '@products/00_shared/utils/baas-utils';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { DEFAULT_REFRESH_INTERVAL } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { BAAS_REFRESH_KEY, LocalStorageService } from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { catchError, of } from 'rxjs';
import { BaasActions } from '../baas-actions.utils';

interface ProductBaaSItem {
  data: ProductBaaS;
  scope: string;
  type: string;
  lastBackup: string;
}

@Component({
  selector: 'spx-baas-list',
  imports: [
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    ContentHeaderComponent,
    ProductListFilterComponent,
    DatePipe,
    ProductTableWrapperComponent,
  ],
  templateUrl: './baas-list.component.html',
  styleUrl: './baas-list.component.scss',
})
export class BaasListComponent {
  protected stateSvc = inject(StateService);
  protected baasSvc = inject(BaasService);
  protected permissionSvc = inject(PermissionService);
  protected route = inject(ActivatedRoute);
  protected lss = inject(LocalStorageService);

  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);

  readonly BAAS_REFRESH_KEY = BAAS_REFRESH_KEY;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(BAAS_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  canProjectBaaSWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectBaaSWrite));
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  displayedColumns: string[] = ['az', 'id', 'name', 'scope', 'type', 'lastBackup', 'gitops', 'actions'];

  baasProduct;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());
  dataSource = computed(() => {
    const items = this.baasProduct.hasValue() ? this.baasProduct.value()! : [];
    const datas: ProductBaaSItem[] = items.map(i => ({
      data: i,
      scope: getBackupScope(i.backup?.metadata.labels),
      type: getBackupType(i.backup),
      lastBackup: getLastBackup(i.backup),
    }));
    const dataSource = new MatTableDataSource(datas);
    dataSource.filterPredicate = this.filterPredicate;
    dataSource.filter = JSON.stringify(this.filterValue(), mapHandlerReplacer);

    return dataSource;
  });


  private needReload = signal(0);

  constructor() {
    const stateSvc = this.stateSvc;
    const baasSvc = this.baasSvc;

    this.baasProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          return baasSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id).pipe(
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

  async changeScheduleState(baas: ProductBaaS) {
    await BaasActions.changeScheduleState(this.baasSvc, this.stateSvc, this.snackbar, baas, () => this.reloadData());
  }

  async openArgoCD(baas: ProductBaaS) {
    await BaasActions.openArgoCD(this.baasSvc, this.stateSvc, baas);
  }

  deleteBaaS(baas: ProductBaaS) {
    BaasActions.deleteBaaS(this.baasSvc, this.stateSvc, this.dialog, baas).then(res => {
      if (res) {
        this.reloadData();
      }
    });
  }

  private filterPredicate(item: ProductBaaSItem, filter: string) {
    const filterMap = JSON.parse(filter, mapHandlerReviver);
    if (filterMap.get('az') && item.data.codeAZ !== filterMap.get('az')) {
      return false;
    }

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
