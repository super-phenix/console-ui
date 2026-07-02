import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductListFilterComponent } from '@products/00_shared/components/product-list-filter/product-list-filter.component';
import { ProductKaaS } from '@products/00_shared/models/product.model';
import { KaasService } from '@products/00_shared/services/kaas.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { DEFAULT_REFRESH_INTERVAL, PRA_LABEL_KEYS } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { KAAS_REFRESH_KEY, LocalStorageService } from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { catchError, of } from 'rxjs';
import { ProductTableWrapperComponent } from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';
import { KaasActions } from '../kaas-actions.utils';

interface ProductKaaSItem {
  data: ProductKaaS;
  isPRA: boolean;
}

@Component({
  selector: 'spx-kaas-list',
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
    ProductTableWrapperComponent,
  ],
  templateUrl: './kaas-list.component.html',
  styleUrl: './kaas-list.component.scss',
})
export class KaasListComponent {
  protected stateSvc = inject(StateService);
  protected kaasSvc = inject(KaasService);
  protected permissionSvc = inject(PermissionService);
  protected route = inject(ActivatedRoute);
  protected lss = inject(LocalStorageService);
  protected sanitizer = inject(DomSanitizer);

  private readonly dialog = inject(MatDialog);

  readonly KAAS_REFRESH_KEY = KAAS_REFRESH_KEY;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(KAAS_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  canProjectKaaSWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectKaaSWrite));
  canProjectKaaSKubeConfig = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectKaaSKubeConfig)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  displayedColumns: string[] = ['az', 'id', 'name', 'gitops', 'actions'];

  kaasProduct;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());
  dataSource = computed(() => {
    const clusters = this.kaasProduct.hasValue() ? this.kaasProduct.value()! : [];
    const datas: ProductKaaSItem[] = clusters.map(i => {
      let isPRA = false;
      if (i.cluster?.cluster.metadata.labels) {
        isPRA = Object.keys(i.cluster.cluster.metadata.labels).some(v => PRA_LABEL_KEYS.includes(v));
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
    const kaasSvc = this.kaasSvc;

    this.kaasProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          return kaasSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id).pipe(
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

  deleteKaaS(cluster: ProductKaaS) {
    KaasActions.deleteKaaS(this.kaasSvc, this.stateSvc, this.dialog, cluster).then(res => {
      if (res) {
        this.reloadData();
      }
    });
  }

  downloadKubeconfig(cluster: ProductKaaS) {
    KaasActions.downloadKubeConfig(this.kaasSvc, this.stateSvc, this.sanitizer, cluster);
  }

  async openArgoCD(cluster: ProductKaaS) {
    await KaasActions.openArgoCD(this.kaasSvc, this.stateSvc, cluster);
  }

  private filterPredicate(item: ProductKaaSItem, filter: string) {
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
