import { Clipboard } from '@angular/cdk/clipboard';
import { DatePipe, KeyValuePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TabsBase } from '@products/00_shared/components/tabs-base/tab-base.component';
import { BaasService } from '@products/00_shared/services/baas.service';
import { getBackupScope } from '@products/00_shared/utils/baas-utils';
import { getProductLabelInfo } from '@products/00_shared/utils/product-label-utils';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';
import { BaasActions } from '../baas-actions.utils';
import { environment } from '@env/environment';

@Component({
  selector: 'spx-baas-details',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    ContentHeaderComponent,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    RouterLink,
    BannerComponent,
    SpanCopyComponent,
    GridDirective,
    DatePipe,
    TitleCasePipe,
    KeyValuePipe,
  ],
  templateUrl: './baas-details.component.html',
  styleUrl: './baas-details.component.scss',
})
export class BaasDetailsComponent extends TabsBase {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected baasSvc = inject(BaasService);
  protected clipboard = inject(Clipboard);

  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  protected readonly supportEmail = environment.supportEmail;
  BannerLevelEnum = BannerLevelEnum;

  az = computed(() => {
    return this.routeParams()?.['az'];
  });

  canProjectBaaSWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectBaaSWrite));
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  routeParams;
  baasProduct;

  isBackup = computed(() => {
    if (this.baasProduct.hasValue()) {
      const baas = this.baasProduct.value();
      return baas.backup?.standalone || baas.backup?.orphan;
    }
    return false;
  });

  backupScope = computed(() => {
    if (this.baasProduct.hasValue()) {
      const baas = this.baasProduct.value();
      return getBackupScope(baas.backup?.metadata.labels);
    }
    return '';
  });

  scheduleDayInterval = computed(() => {
    const schedule = this.baasProduct.value()?.backup?.schedule?.spec?.schedule;
    if (!schedule) return null;
    const match = schedule.match(/\*\/(\d+)/);
    return match ? match[1] : null;
  });

  backupColumns: string[] = ['name', 'phase', 'warnings', 'errors', 'completionTimestamp'];

  matchLabels = computed(() => {
    if (this.baasProduct.hasValue()) {
      const baas = this.baasProduct.value();
      let matchLabels;
      if (this.isBackup()) {
        matchLabels = baas.backup?.backup?.spec?.labelSelector?.matchLabels;
      } else {
        matchLabels = baas.backup?.schedule?.spec?.labelSelector?.matchLabels;
      }
      return matchLabels || [];
    }
    return [];
  });

  productLabelInfo = computed(() => {
    if (this.baasProduct.hasValue()) {
      return getProductLabelInfo(this.baasProduct.value().backup?.metadata?.labels);
    }
    return getProductLabelInfo();
  });

  reload = signal<number>(0);

  backups = computed(() => {
    if (this.baasProduct.hasValue()) {
      const baas = this.baasProduct.value();
      const backups = [...(baas.backup?.schedule?.backups ?? [])];

      // Sort backup by completion date
      return backups.sort((a, b) => {
        const dateA = a.status?.completionTimestamp ? new Date(a.status.completionTimestamp).getTime() : 0;
        const dateB = b.status?.completionTimestamp ? new Date(b.status.completionTimestamp).getTime() : 0;
        return dateB - dateA;
      });
    }
    return [];
  });

  constructor() {
    super();
    const stateSvc = this.stateSvc;
    const baasSvc = this.baasSvc;
    const route = inject(ActivatedRoute);

    this.routeParams = toSignal(route.params);

    this.baasProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.routeParams(), this.reload()]),
      stream: () => {
        const az = this.routeParams()?.['az'];
        const id = this.routeParams()?.['id'];

        if (stateSvc.organization() && stateSvc.project() && id) {
          return baasSvc.get(stateSvc.organization()!.id, stateSvc.project()!.id, az, id);
        } else {
          return of();
        }
      },
    });
  }

  copy(value: string) {
    this.clipboard.copy(value);
    this.snackbar.open('Copy to clipboard!', undefined, {
      horizontalPosition: 'end',
      duration: 3000,
    });
  }

  copyShareLink() {
    const url = `https://${window.location.host}/redirect/${this.stateSvc.organization()?.id}/${this.stateSvc.project()?.id}/${this.az()}/baas/${this.routeParams()?.['id']}`;
    this.copy(url);
  }

  async changeScheduleState() {
    if (this.baasProduct.hasValue()) {
      await BaasActions.changeScheduleState(this.baasSvc, this.stateSvc, this.snackbar, this.baasProduct.value(), () =>
        // eslint-disable-next-line no-useless-assignment
        this.reload.update(v => (v += 1))
      );
    }
  }

  async openArgoCD() {
    if (this.baasProduct.hasValue()) {
      await BaasActions.openArgoCD(this.baasSvc, this.stateSvc, this.baasProduct.value());
    }
  }

  deleteBaaS() {
    if (this.baasProduct.hasValue()) {
      BaasActions.deleteBaaS(this.baasSvc, this.stateSvc, this.dialog, this.baasProduct.value()).then(res => {
        if (res) {
          this.router.navigate(['/products', 'storage', 'baas']);
        }
      });
    }
  }
}
