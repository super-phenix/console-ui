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
import { ProductVPC } from '@products/00_shared/models/product.model';
import { VPCService } from '@products/00_shared/services/vpc.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { DEFAULT_REFRESH_INTERVAL, PRA_LABEL_KEYS } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { VPC_REFRESH_KEY, LocalStorageService } from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { catchError, of } from 'rxjs';
import { ProductTableWrapperComponent } from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';
import { VpcActions } from '../vpc-actions.utils';

interface ProductVPCItem {
  data: ProductVPC;
  isPRA: boolean;
}

@Component({
  selector: 'spx-vpc-list',
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
  templateUrl: './vpc-list.component.html',
  styleUrl: './vpc-list.component.scss',
})
export class VpcListComponent {
  protected stateSvc = inject(StateService);
  protected vpcSvc = inject(VPCService);
  protected permissionSvc = inject(PermissionService);
  protected route = inject(ActivatedRoute);
  protected router = inject(Router);
  protected lss = inject(LocalStorageService);

  private readonly dialog = inject(MatDialog);

  readonly VPC_REFRESH_KEY = VPC_REFRESH_KEY;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(VPC_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  canProjectVPCWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectVPCWrite));
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));
  canProjectSubnetWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSubnetWrite));

  displayedColumns: string[] = ['az', 'id', 'name', 'gitops', 'actions'];

  vpcProduct;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());
  dataSource = computed(() => {
    const vpcs = this.vpcProduct.hasValue() ? this.vpcProduct.value()! : [];
    const datas: ProductVPCItem[] = vpcs.map(i => {
      let isPRA = false;
      if (i.vpc?.metadata.labels) {
        isPRA = Object.keys(i.vpc.metadata.labels).some(v => PRA_LABEL_KEYS.includes(v));
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
    const vpcSvc = this.vpcSvc;

    this.vpcProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          return vpcSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id).pipe(
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

  deleteVPC(vpc: ProductVPC) {
    VpcActions.deleteVPC(this.vpcSvc, this.stateSvc, this.dialog, vpc.codeAZ!, vpc).then(res => {
      if (res) {
        this.reloadData();
      }
    });
  }

  openArgoCD(vpc: ProductVPC) {
    VpcActions.openArgoCD(this.vpcSvc, this.stateSvc, vpc.codeAZ!, vpc);
  }

  addSubnet(vpc: ProductVPC) {
    VpcActions.addSubnet(this.router, vpc.codeAZ!, vpc);
  }

  private filterPredicate(item: ProductVPCItem, filter: string) {
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
