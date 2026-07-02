import { Component, computed, inject, input, signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductInstance, ProductKaaS } from '@products/00_shared/models/product.model';
import { AZService } from '@products/00_shared/services/az.service';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { KaasService } from '@products/00_shared/services/kaas.service';
import { AutoRefreshComponent } from '@shared/components/auto-refresh/auto-refresh.component';
import { PRA_LABEL_KEYS } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { catchError, firstValueFrom, of } from 'rxjs';

interface ProductInstanceItem {
  data: ProductInstance;
  isPRA: boolean;
}

@Component({
  selector: 'spx-kaas-details-instances',
  imports: [
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatInputModule,
    MatChipsModule,
    MatMenuModule,
    AutoRefreshComponent,
  ],
  templateUrl: './kaas-details-instances.component.html',
  styleUrl: './kaas-details-instances.component.scss',
})
export class KaasDetailsInstancesComponent {
  protected stateSvc = inject(StateService);
  protected kaasSvc = inject(KaasService);
  protected instanceSvc = inject(InstanceService);
  protected azSvc = inject(AZService);
  protected permissionSvc = inject(PermissionService);
  protected route = inject(ActivatedRoute);

  canProjectInstanceControl = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceControl)
  );
  canProjectInstanceTerminal = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceTerminal)
  );

  displayedColumns: string[] = ['id', 'name', 'ip', 'gitops', 'status', 'actions'];

  instancesResource;

  az = input.required<string>();
  cluster = input.required<ProductKaaS>();

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());
  dataSource = computed(() => {
    let instances = this.instancesResource.hasValue() ? this.instancesResource.value()! : [];
    if (instances == null) {
      instances = [];
    }
    const datas: ProductInstanceItem[] = instances.map(i => {
      let isPRA = false;
      if (i.vm?.metadata.labels) {
        isPRA = Object.keys(i.vm.metadata.labels).some(v => PRA_LABEL_KEYS.includes(v));
      }

      return {
        data: i,
        isPRA: isPRA,
      };
    });

    const sortedDatas = datas.sort((a, b) => {
      const cmp = a.data.productName.localeCompare(b.data.productName);
      return cmp === 0 ? a.data.eid.localeCompare(b.data.eid) : cmp;
    });
    const dataSource = new MatTableDataSource(sortedDatas);
    return dataSource;
  });

  protected needReload = signal(0);

  constructor() {
    const stateSvc = this.stateSvc;
    const kaasSvc = this.kaasSvc;

    this.instancesResource = rxResource({
      params: computed(() => [
        stateSvc.project(),
        stateSvc.organization(),
        this.az(),
        this.cluster(),
        this.needReload(),
      ]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project() && this.cluster() && this.az()) {
          return kaasSvc
            .listInstances(stateSvc.organization()!.id, stateSvc.project()!.id, this.az(), this.cluster().eid)
            .pipe(
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

  start(instance: ProductInstance) {
    if (this.az() && instance.eid) {
      firstValueFrom(
        this.instanceSvc.startVM(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az(), instance.eid)
      ).then(() => this.reloadData());
    }
  }

  stop(instance: ProductInstance) {
    if (this.az() && instance.eid) {
      firstValueFrom(
        this.instanceSvc.stopVM(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az(), instance.eid)
      ).then(() => this.reloadData());
    }
  }

  openConsole(product: ProductInstance) {
    window.open(
      `${document.baseURI}terminal/${this.stateSvc.organization()!.id}/${this.stateSvc.project()!.id}/${this.az()}/${product.eid}`,
      '_blank',
      'popup=yes,height=620,width=780'
    );
  }

  reloadData() {
    this.needReload.update(v => v + 1);
  }
}
