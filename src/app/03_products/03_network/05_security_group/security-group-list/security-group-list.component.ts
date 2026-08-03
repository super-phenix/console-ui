import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SecurityGroupActions } from '../security-group-actions.utils';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductListFilterComponent } from '@products/00_shared/components/product-list-filter/product-list-filter.component';
import { ProductSecurityGroup } from '@products/00_shared/models/product.model';
import { SecurityGroupService } from '@products/00_shared/services/security-group.service';
import { isClusterResource } from '@products/00_shared/utils/cluster-utils';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { DEFAULT_REFRESH_INTERVAL, PRA_LABEL_KEYS } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import {
  SECURITY_GROUP_REFRESH_KEY,
  SECURITY_GROUP_SHOW_CLUSTER_KEY,
  LocalStorageService,
} from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { catchError, of } from 'rxjs';
import { ProductTableWrapperComponent } from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';

interface ProductSecurityGroupItem {
  data: ProductSecurityGroup;
  isPRA: boolean;
  isClusterSecurityGroup: boolean;
}

@Component({
  selector: 'spx-security-group-list',
  imports: [
    MatSlideToggleModule,
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
  templateUrl: './security-group-list.component.html',
  styleUrl: './security-group-list.component.scss',
})
export class SecurityGroupListComponent {
  protected stateSvc = inject(StateService);
  protected sgSvc = inject(SecurityGroupService);
  protected permissionSvc = inject(PermissionService);
  protected route = inject(ActivatedRoute);
  protected lss = inject(LocalStorageService);

  private readonly dialog = inject(MatDialog);

  canProjectSecurityGroupWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSecurityGroupWrite)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  displayedColumns: string[] = ['az', 'id', 'name', 'description', 'policyType', 'gitops', 'actions'];

  securityGroupProduct;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());

  showClusterSecurityGroup = computed<boolean>(() => {
    const val = this.lss.getValue(SECURITY_GROUP_SHOW_CLUSTER_KEY)();
    return val != null ? val === 'true' : true;
  });

  readonly SECURITY_GROUP_SHOW_CLUSTER_KEY = SECURITY_GROUP_SHOW_CLUSTER_KEY;
  readonly SECURITY_GROUP_REFRESH_KEY = SECURITY_GROUP_REFRESH_KEY;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(SECURITY_GROUP_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  dataSource = computed(() => {
    const sgs = this.securityGroupProduct.hasValue() ? this.securityGroupProduct.value()! : [];
    const datas: ProductSecurityGroupItem[] = sgs.map(i => {
      let isPRA = false;
      let isCluster = false;
      if (i.securityGroup?.metadata.labels) {
        isPRA = Object.keys(i.securityGroup.metadata.labels).some(v => PRA_LABEL_KEYS.includes(v));
        isCluster = isClusterResource(i.securityGroup.metadata.labels);
      }

      return {
        data: i,
        isPRA: isPRA,
        isClusterSecurityGroup: isCluster,
      };
    });
    const dataSource = new MatTableDataSource(datas);
    // Override filterPredicate to use nested object
    dataSource.filterPredicate = this.filterPredicate;
    const filter = this.filterValue().set('showClusterSecurityGroup', this.showClusterSecurityGroup() ? 'true' : 'false');
    dataSource.filter = JSON.stringify(filter, mapHandlerReplacer);

    return dataSource;
  });


  private needReload = signal(0);

  constructor() {
    const stateSvc = this.stateSvc;
    const sgSvc = this.sgSvc;

    this.securityGroupProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          return sgSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id).pipe(
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

  openArgoCD(sg: ProductSecurityGroup) {
    SecurityGroupActions.openArgoCD(this.sgSvc, this.stateSvc, sg.codeAZ!, sg.eid);
  }

  deleteSecurityGroup(sg: ProductSecurityGroup) {
    if (sg.codeAZ && sg.eid) {
      SecurityGroupActions.deleteSecurityGroup(
        this.sgSvc,
        this.stateSvc,
        this.dialog,
        sg.codeAZ,
        sg.eid,
        sg.productName
      ).then(res => {
        if (res) {
          this.reloadData();
        }
      });
    }
  }

  private filterPredicate(item: ProductSecurityGroupItem, filter: string) {
    const filterMap = JSON.parse(filter, mapHandlerReviver);
    // If we have a az filter and it doesn't match
    if (filterMap.get('az') && item.data.codeAZ !== filterMap.get('az')) {
      return false;
    }

    if (filterMap.get('showClusterSecurityGroup') != 'true' && item.isClusterSecurityGroup) {
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
