import { Clipboard } from '@angular/cdk/clipboard';
import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '@env/environment';
import { TabsBase } from '@products/00_shared/components/tabs-base/tab-base.component';
import {
  DBaaSEndpoint,
  DBaaSNetwork,
  postgresMajor,
  postgresVersionFromImage,
} from '@products/00_shared/models/paas/dbaas/dbaas.model';
import { DBaaSService } from '@products/00_shared/services/dbaas.service';
import { EipService } from '@products/00_shared/services/eip.service';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';
import { DBaaSActions, dbaasPhaseChip, isDBaaSHealthy, sortEndpoints } from '../dbaas-actions.utils';
import { DBaaSDetailsConnectComponent } from './dbaas-details-connect/dbaas-details-connect.component';
import { DBaaSDetailsGeneralComponent } from './dbaas-details-general/dbaas-details-general.component';
import { DBaaSDetailsSettingsComponent } from './dbaas-details-settings/dbaas-details-settings.component';

// While the cluster is not healthy the page follows its progress on its own.
export const DBAAS_POLL_SECONDS = 10;

const TAB_CONNECT = 1;

@Component({
  selector: 'spx-dbaas-details',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
    RouterLink,
    BannerComponent,
    DBaaSDetailsGeneralComponent,
    DBaaSDetailsConnectComponent,
    DBaaSDetailsSettingsComponent,
  ],
  templateUrl: './dbaas-details.component.html',
  styleUrl: './dbaas-details.component.scss',
})
export class DBaaSDetailsComponent extends TabsBase {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected dbaasSvc = inject(DBaaSService);
  private readonly eipSvc = inject(EipService);
  private readonly clipboard = inject(Clipboard);

  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  protected readonly supportEmail = environment.supportEmail;
  protected readonly pollSeconds = DBAAS_POLL_SECONDS;
  BannerLevelEnum = BannerLevelEnum;

  az = computed(() => {
    return this.routeParams()?.['az'];
  });

  canProjectDBaaSWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectDBaaSWrite));
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  routeParams;
  dbaasProduct;

  db = computed(() => (this.dbaasProduct.hasValue() ? this.dbaasProduct.value() : undefined));
  chip = computed(() => dbaasPhaseChip(this.db()?.cluster));
  // "status-chip--ready" -> "ready"
  statusLevel = computed(() => this.chip().cls.replace('status-chip--', ''));
  isReady = computed(() => isDBaaSHealthy(this.db()?.cluster));
  version = computed(() => postgresVersionFromImage(this.db()?.cluster?.spec?.imageName));
  major = computed(() => {
    const version = this.version();
    return version ? postgresMajor(version) : undefined;
  });
  // Zone from the organization's AZ list, for its display name and logo
  zone = computed(() => this.stateSvc.azList().find(az => az.code === this.db()?.codeAZ));
  instances = computed(() => {
    const cluster = this.db()?.cluster;
    return cluster?.spec?.instances || cluster?.status?.instances;
  });

  // The API only sends the EIP id, its address comes from the EIP itself. Keyed on a string so the
  // periodic reloads, which hand in a new db object, do not refetch it.
  private eipKey = computed(() => {
    const db = this.db();
    const eid = db?.externalAccess?.eipEId;
    const org = this.stateSvc.organization()?.id;
    const project = this.stateSvc.project()?.id;
    const canRead = this.permissionSvc.permissions().includes(PermissionsEnum.ProjectEipRead);
    return eid && org && project && canRead ? [org, project, db.codeAZ, eid].join('/') : undefined;
  });
  eip = rxResource({
    params: () => this.eipKey(),
    stream: ({ params }) => {
      const [org, project, az, eid] = params.split('/');
      return this.eipSvc.get(org, project, az, eid);
    },
  });
  // The Elastic IP forwards every load balancer port as is (sfs-dbaas eip.yaml), so the public
  // endpoints are the private ones with the EIP address as host.
  publicEndpoints = computed<DBaaSEndpoint[]>(() => {
    const ip = this.eip.hasValue() ? this.eip.value()?.eip?.status?.ip : undefined;
    return ip ? sortEndpoints(this.db()?.endpoints).map(e => ({ ...e, host: ip })) : [];
  });

  selectedTab = linkedSignal(() => Number(this.initialIndex() ?? 0) || 0);
  // Network preselected on the Connect tab, set by whoever opened it
  connectNetwork = signal<DBaaSNetwork>('private');

  constructor() {
    super();
    const route = inject(ActivatedRoute);

    this.routeParams = toSignal(route.params);
    this.dbaasProduct = rxResource({
      params: computed(() => [this.stateSvc.project(), this.stateSvc.organization(), this.routeParams()]),
      stream: () => {
        const az = this.routeParams()?.['az'];
        const id = this.routeParams()?.['id'];

        if (this.stateSvc.organization() && this.stateSvc.project() && id) {
          return this.dbaasSvc.get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, az, id);
        } else {
          return of();
        }
      },
    });

    effect(onCleanup => {
      if (!this.dbaasProduct.hasValue() || this.dbaasProduct.isLoading() || this.isReady()) {
        return;
      }
      const timeout = setTimeout(() => this.reload(), DBAAS_POLL_SECONDS * 1000);
      onCleanup(() => clearTimeout(timeout));
    });
  }

  // reload() keeps the current value while fetching, so the page does not flash back to the spinner.
  reload() {
    this.dbaasProduct.reload();
  }

  selectTab(index: number) {
    this.selectedTab.set(index);
    this.updateFragment(index);
  }

  openConnect(network: DBaaSNetwork = 'private') {
    this.connectNetwork.set(network);
    this.selectTab(TAB_CONNECT);
  }

  copyShareLink() {
    const url = `https://${window.location.host}/redirect/${this.stateSvc.organization()?.id}/${this.stateSvc.project()?.id}/${this.az()}/dbaas/${this.routeParams()?.['id']}`;
    this.clipboard.copy(url);
    this.snackbar.open('Copy to clipboard!', undefined, {
      horizontalPosition: 'end',
      duration: 3000,
    });
  }

  openArgoCD() {
    const db = this.db();
    if (db) {
      DBaaSActions.openArgoCD(this.dbaasSvc, this.stateSvc, this.az(), db);
    }
  }

  restartDBaaS() {
    const db = this.db();
    if (db) {
      DBaaSActions.restartDBaaS(this.dbaasSvc, this.stateSvc, this.dialog, this.az(), db).then(res => {
        if (res) {
          this.reload();
        }
      });
    }
  }

  deleteDBaaS() {
    const db = this.db();
    if (db) {
      DBaaSActions.deleteDBaaS(this.dbaasSvc, this.stateSvc, this.dialog, this.az(), db).then(res => {
        if (res) {
          this.router.navigate(['/products', 'paas', 'dbaas']);
        }
      });
    }
  }
}
