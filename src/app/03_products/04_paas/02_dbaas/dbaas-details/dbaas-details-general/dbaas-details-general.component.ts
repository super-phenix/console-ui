import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import {
  DBaaSEndpoint,
  DBaaSNetwork,
  postgresVersionFromImage,
} from '@products/00_shared/models/paas/dbaas/dbaas.model';
import { ProductDBaaS } from '@products/00_shared/models/product.model';
import { CodeBlockComponent } from '@shared/components/code-block/code-block.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { DBaaSTopologyComponent } from '../../00_shared/dbaas-topology/dbaas-topology.component';
import {
  cpuCores,
  endpointRoleHint,
  endpointRoleLabel,
  formatAmount,
  memoryGiB,
  privateEndpoints,
} from '../../dbaas-actions.utils';

@Component({
  selector: 'spx-dbaas-details-general',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    CodeBlockComponent,
    SpanCopyComponent,
    DBaaSTopologyComponent,
  ],
  templateUrl: './dbaas-details-general.component.html',
  styleUrl: './dbaas-details-general.component.scss',
})
export class DBaaSDetailsGeneralComponent {
  protected permissionSvc = inject(PermissionService);
  protected stateSvc = inject(StateService);

  readonly endpointRoleLabel = endpointRoleLabel;
  readonly endpointRoleHint = endpointRoleHint;

  db = input.required<ProductDBaaS>();
  // Endpoints through the Elastic IP, empty until it has an address
  publicEndpoints = input<DBaaSEndpoint[]>([]);
  // Asks the page to open the Connect tab on the given network
  connect = output<DBaaSNetwork>();

  network = signal<DBaaSNetwork>('private');
  isPublic = computed(() => !!this.db().externalAccess?.eipEId);
  // Falls back to private when public access gets turned off while the public view is open
  shownNetwork = computed<DBaaSNetwork>(() => (this.isPublic() ? this.network() : 'private'));
  publicOffHint = computed(() =>
    this.canEdit()
      ? 'Public access is off. Turn it on by editing the database.'
      : 'Public access is off. The database is only reachable from its subnet.'
  );

  canEdit = computed(
    () =>
      this.db().gitops !== 'true' && this.permissionSvc.permissions().includes(PermissionsEnum.ProjectDBaaSWrite)
  );

  // Zone from the organization's AZ list, for its display name and logo
  zone = computed(() => this.stateSvc.azList().find(az => az.code === this.db().codeAZ));
  version = computed(() => postgresVersionFromImage(this.db().cluster?.spec?.imageName));
  endpoints = computed(() => privateEndpoints(this.db().endpoints));
  primaryEndpoint = computed(() => this.endpoints()[0]);
  // Every endpoint shares the load balancer VIP
  host = computed(() => this.primaryEndpoint()?.host);
  limits = computed(() => this.db().cluster?.spec?.resources?.limits);
  instances = computed(() => {
    const cluster = this.db().cluster;
    return cluster?.spec?.instances || cluster?.status?.instances || 1;
  });

  // Whole-cluster footprint: per-instance limits times the instance count. Undefined when a limit is not
  // a quantity we can parse, in which case the template only shows the per-instance value.
  totalCpu = computed(() => {
    const cores = cpuCores(this.limits()?.cpu);
    return cores === undefined ? undefined : formatAmount(cores * this.instances());
  });
  totalMemory = computed(() => {
    const gib = memoryGiB(this.limits()?.memory);
    return gib === undefined ? undefined : formatAmount(gib * this.instances());
  });
  totalStorage = computed(() => {
    const gib = memoryGiB(this.db().cluster?.spec?.storage?.size);
    return gib === undefined ? undefined : formatAmount(gib * this.instances());
  });

  cpuLabel = computed(() => {
    const cores = cpuCores(this.limits()?.cpu);
    return cores === undefined ? this.limits()?.cpu : `${formatAmount(cores)} vCPU`;
  });
  memoryLabel = computed(() => {
    const gib = memoryGiB(this.limits()?.memory);
    return gib === undefined ? this.limits()?.memory : `${formatAmount(gib)} GiB`;
  });
  storageLabel = computed(() => {
    const size = this.db().cluster?.spec?.storage?.size;
    const gib = memoryGiB(size);
    return gib === undefined ? size : `${formatAmount(gib)} GiB`;
  });
}
