import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FirewallActions } from '../firewall-actions.utils';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductListFilterComponent } from '@products/00_shared/components/product-list-filter/product-list-filter.component';
import { ProductFirewall } from '@products/00_shared/models/product.model';
import { FirewallService } from '@products/00_shared/services/firewall.service';
import { isClusterResource } from '@products/00_shared/utils/cluster-utils';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { DEFAULT_REFRESH_INTERVAL, PRA_LABEL_KEYS } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import {
  FIREWALL_REFRESH_KEY,
  FIREWALL_SHOW_CLUSTER_KEY,
  LocalStorageService,
} from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { catchError, of } from 'rxjs';
import { ProductTableWrapperComponent } from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';

interface ProductFirewallItem {
  data: ProductFirewall;
  isPRA: boolean;
  isClusterFirewall: boolean;
}

@Component({
  selector: 'spx-firewall-list',
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
  templateUrl: './firewall-list.component.html',
  styleUrl: './firewall-list.component.scss',
})
export class FirewallListComponent {
  protected stateSvc = inject(StateService);
  protected fwSvc = inject(FirewallService);
  protected permissionSvc = inject(PermissionService);
  protected route = inject(ActivatedRoute);
  protected lss = inject(LocalStorageService);

  private readonly dialog = inject(MatDialog);

  canProjectFirewallWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectFirewallWrite)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  displayedColumns: string[] = ['az', 'id', 'name', 'description', 'policyType', 'gitops', 'actions'];

  firewallProduct;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());

  showClusterFirewall = computed<boolean>(() => {
    const val = this.lss.getValue(FIREWALL_SHOW_CLUSTER_KEY)();
    return val != null ? val === 'true' : true;
  });

  readonly FIREWALL_SHOW_CLUSTER_KEY = FIREWALL_SHOW_CLUSTER_KEY;
  readonly FIREWALL_REFRESH_KEY = FIREWALL_REFRESH_KEY;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(FIREWALL_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  dataSource = computed(() => {
    const fws = this.firewallProduct.hasValue() ? this.firewallProduct.value()! : [];
    const datas: ProductFirewallItem[] = fws.map(i => {
      let isPRA = false;
      let isCluster = false;
      if (i.firewall?.metadata.labels) {
        isPRA = Object.keys(i.firewall.metadata.labels).some(v => PRA_LABEL_KEYS.includes(v));
        isCluster = isClusterResource(i.firewall.metadata.labels);
      }

      return {
        data: i,
        isPRA: isPRA,
        isClusterFirewall: isCluster,
      };
    });
    const dataSource = new MatTableDataSource(datas);
    // Override filterPredicate to use nested object
    dataSource.filterPredicate = this.filterPredicate;
    const filter = this.filterValue().set('showClusterFirewall', this.showClusterFirewall() ? 'true' : 'false');
    dataSource.filter = JSON.stringify(filter, mapHandlerReplacer);

    return dataSource;
  });


  private needReload = signal(0);

  constructor() {
    const stateSvc = this.stateSvc;
    const fwSvc = this.fwSvc;

    this.firewallProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          return fwSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id).pipe(
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

  openArgoCD(fw: ProductFirewall) {
    FirewallActions.openArgoCD(this.fwSvc, this.stateSvc, fw.codeAZ!, fw.eid);
  }

  deleteFirewall(fw: ProductFirewall) {
    if (fw.codeAZ && fw.eid) {
      FirewallActions.deleteFirewall(
        this.fwSvc,
        this.stateSvc,
        this.dialog,
        fw.codeAZ,
        fw.eid,
        fw.productName
      ).then(res => {
        if (res) {
          this.reloadData();
        }
      });
    }
  }

  private filterPredicate(item: ProductFirewallItem, filter: string) {
    const filterMap = JSON.parse(filter, mapHandlerReviver);
    // If we have a az filter and it doesn't match
    if (filterMap.get('az') && item.data.codeAZ !== filterMap.get('az')) {
      return false;
    }

    if (filterMap.get('showClusterFirewall') != 'true' && item.isClusterFirewall) {
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
