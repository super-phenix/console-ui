import { Clipboard } from '@angular/cdk/clipboard';
import { Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TabsBase } from '@products/00_shared/components/tabs-base/tab-base.component';
import { Snapshot, SnapshotSchedule } from '@products/00_shared/models/storage/snapshot/snapshot.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { SnapshotService } from '@products/00_shared/services/snapshot.service';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { PRA_LABEL_KEYS } from '@shared/models/consts';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';
import { SnapshotDetailsLinkedSnapComponent } from './snapshot-details-linked-snap/snapshot-details-linked-snap.component';
import { SnapshotDetailsScheduleComponent } from './snapshot-details-schedule/snapshot-details-schedule.component';
import { SnapshotDetailsSingleComponent } from './snapshot-details-single/snapshot-details-single.component';
import { SnapshotActions } from '../snapshot-actions.utils';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '@env/environment';

@Component({
  selector: 'spx-snapshot-details',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTabsModule,
    ContentHeaderComponent,
    MatChipsModule,
    BannerComponent,
    SnapshotDetailsSingleComponent,
    SnapshotDetailsLinkedSnapComponent,
    SnapshotDetailsScheduleComponent,
    RouterLink,
  ],
  templateUrl: './snapshot-details.component.html',
  styleUrl: './snapshot-details.component.scss',
})
export class SnapshotDetailsComponent extends TabsBase {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected snapshotSvc = inject(SnapshotService);
  protected diskSvc = inject(DiskService);
  protected clipboard = inject(Clipboard);
  protected override router = inject(Router);

  protected readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  protected readonly supportEmail = environment.supportEmail;
  BannerLevelEnum = BannerLevelEnum;
  az = computed(() => {
    return this.routeParams()?.['az'];
  });

  canProjectSnapshotWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSnapshotWrite)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  routeParams;
  snapshotProduct;

  isPRA = computed(() => {
    if (this.snapshotProduct.hasValue()) {
      if (this.snapshotProduct.value().snapshot?.metadata.labels) {
        return Object.keys(this.snapshotProduct.value().snapshot!.metadata.labels!).some(v =>
          PRA_LABEL_KEYS.includes(v)
        );
      }
    }

    return false;
  });

  snapshot = computed<Snapshot | undefined>(() => {
    if (this.snapshotProduct.hasValue() && this.snapshotProduct.value().snapshot) {
      return this.snapshotProduct.value().snapshot;
    } else {
      return undefined;
    }
  });

  snapshotSchedule = computed<SnapshotSchedule | undefined>(() => {
    if (this.snapshotProduct.hasValue() && this.snapshotProduct.value().snapshotSchedule) {
      return this.snapshotProduct.value().snapshotSchedule;
    } else {
      return undefined;
    }
  });

  constructor() {
    super();
    const stateSvc = this.stateSvc;
    const snapshotSvc = this.snapshotSvc;
    const route = inject(ActivatedRoute);

    this.routeParams = toSignal(route.params);
    this.snapshotProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.routeParams()]),
      stream: () => {
        const az = this.routeParams()?.['az'];
        const id = this.routeParams()?.['id'];

        if (stateSvc.organization() && stateSvc.project() && id) {
          return snapshotSvc.get(stateSvc.organization()!.id, stateSvc.project()!.id, az, id);
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
    const url = `https://${window.location.host}/redirect/${this.stateSvc.organization()?.id}/${this.stateSvc.project()?.id}/${this.az()}/snapshot/${this.routeParams()?.['id']}`;
    this.copy(url);
  }

  openArgoCD() {
    const product = this.snapshotProduct.value();
    if (product) {
      SnapshotActions.openArgoCD(this.snapshotSvc, this.stateSvc, product);
    }
  }

  deleteSnapshot() {
    const product = this.snapshotProduct.value();
    if (product) {
      SnapshotActions.deleteSnapshot(this.snapshotSvc, this.stateSvc, this.dialog, product).then(res => {
        if (res) {
          this.router.navigate(['/products', 'storage', 'snapshot']);
        }
      });
    }
  }
}
