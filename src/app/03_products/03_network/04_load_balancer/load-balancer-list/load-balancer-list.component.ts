import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductListFilterComponent } from '@products/00_shared/components/product-list-filter/product-list-filter.component';
import { ProductLoadBalancer } from '@products/00_shared/models/product.model';
import { LoadBalancerService } from '@products/00_shared/services/load-balancer.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { DEFAULT_REFRESH_INTERVAL, PRA_LABEL_KEYS } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { LOAD_BALANCER_REFRESH_KEY, LocalStorageService } from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { catchError, of } from 'rxjs';
import { ProductTableWrapperComponent } from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';
import { LoadBalancerActions } from '../load-balancer-actions.utils';

interface ProductLoadBalancerItem {
  data: ProductLoadBalancer;
  isPRA: boolean;
}

@Component({
  selector: 'spx-load-balancer-list',
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
  templateUrl: './load-balancer-list.component.html',
  styleUrl: './load-balancer-list.component.scss',
})
export class LoadBalancerListComponent {
  protected stateSvc = inject(StateService);
  protected loadBalancerSvc = inject(LoadBalancerService);
  protected permissionSvc = inject(PermissionService);
  protected route = inject(ActivatedRoute);
  protected lss = inject(LocalStorageService);

  private readonly dialog = inject(MatDialog);

  readonly LOAD_BALANCER_REFRESH_KEY = LOAD_BALANCER_REFRESH_KEY;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(LOAD_BALANCER_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  canProjectLoadBalancerWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectLoadBalancerWrite)
  );

  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  displayedColumns: string[] = ['az', 'id', 'name', 'gitops', 'actions'];

  lbProduct;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());
  dataSource = computed(() => {
    const lbs = this.lbProduct.hasValue() ? this.lbProduct.value()! : [];
    const datas: ProductLoadBalancerItem[] = lbs.map(i => {
      let isPRA = false;
      if (i.loadBalancer?.metadata.labels) {
        isPRA = Object.keys(i.loadBalancer.metadata.labels).some(v => PRA_LABEL_KEYS.includes(v));
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
    const loadBalancerSvc = this.loadBalancerSvc;

    this.lbProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          return loadBalancerSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id).pipe(
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

  async deleteLoadBalancer(lb: ProductLoadBalancer) {
    if (lb.codeAZ && lb.eid) {
      const res = await LoadBalancerActions.deleteLoadBalancer(
        this.loadBalancerSvc,
        this.stateSvc,
        this.dialog,
        lb.codeAZ,
        lb.eid,
        lb.productName
      );
      if (res) {
        this.reloadData();
      }
    }
  }

  openArgoCD(lb: ProductLoadBalancer) {
    if (lb.codeAZ && lb.eid) {
      LoadBalancerActions.openArgoCD(this.loadBalancerSvc, this.stateSvc, lb.codeAZ, lb.eid);
    }
  }

  private filterPredicate(item: ProductLoadBalancerItem, filter: string) {
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
