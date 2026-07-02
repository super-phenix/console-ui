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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductListFilterComponent } from '@products/00_shared/components/product-list-filter/product-list-filter.component';
import { ProductSubnet } from '@products/00_shared/models/product.model';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { SubnetActions } from '../subnet-actions.utils';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { DEFAULT_REFRESH_INTERVAL, PRA_LABEL_KEYS } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { SUBNET_REFRESH_KEY, LocalStorageService } from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { catchError, of } from 'rxjs';
import { ProductTableWrapperComponent } from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';

interface ProductSubnetItem {
  data: ProductSubnet;
  isPRA: boolean;
}

@Component({
  selector: 'spx-subnet-list',
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
  templateUrl: './subnet-list.component.html',
  styleUrl: './subnet-list.component.scss',
})
export class SubnetListComponent {
  protected stateSvc = inject(StateService);
  protected subnetSvc = inject(SubnetService);
  protected permissionSvc = inject(PermissionService);
  protected route = inject(ActivatedRoute);
  protected lss = inject(LocalStorageService);
  protected router = inject(Router);

  private readonly dialog = inject(MatDialog);

  readonly SUBNET_REFRESH_KEY = SUBNET_REFRESH_KEY;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(SUBNET_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  canProjectSubnetWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSubnetWrite));
  canProjectEipWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectEipWrite));
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  displayedColumns: string[] = ['az', 'id', 'name', 'cidr', 'gitops', 'actions'];

  subnetProduct;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());
  dataSource = computed(() => {
    const subnets = this.subnetProduct.hasValue() ? this.subnetProduct.value()! : [];

    const datas: ProductSubnetItem[] = subnets.map(i => {
      let isPRA = false;
      if (i.subnet?.metadata.labels) {
        isPRA = Object.keys(i.subnet.metadata.labels).some(v => PRA_LABEL_KEYS.includes(v));
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
    const subnetSvc = this.subnetSvc;

    this.subnetProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          return subnetSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id).pipe(
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

  openArgoCD(subnet: ProductSubnet) {
    SubnetActions.openArgoCD(this.subnetSvc, this.stateSvc, subnet);
  }

  deleteSubnet(subnet: ProductSubnet) {
    SubnetActions.deleteSubnet(this.subnetSvc, this.stateSvc, this.dialog, subnet).then(res => {
      if (res) {
        this.reloadData();
      }
    });
  }

  private filterPredicate(item: ProductSubnetItem, filter: string) {
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

  attachEip(subnet: ProductSubnet) {
    SubnetActions.attachEip(this.router, subnet);
  }
}
