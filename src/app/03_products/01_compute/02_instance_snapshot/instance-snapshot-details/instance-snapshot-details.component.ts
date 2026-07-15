import { Clipboard } from '@angular/cdk/clipboard';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductSnapshot } from '@products/00_shared/models/product.model';
import { InstanceSnapshotService } from '@products/00_shared/services/instance-snapshot.service';
import { getProductLabelInfo } from '@products/00_shared/utils/product-label-utils';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { SnapshotService } from '@products/00_shared/services/snapshot.service';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { PRA_LABEL_KEYS } from '@shared/models/consts';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { InstanceSnapshotActions } from '../instance-snapshot-actions.utils';
import { EMPTY, forkJoin, Observable, of } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'spx-instance-snapshot-details',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ContentHeaderComponent,
    KeyValuePipe,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    RouterLink,
    BannerComponent,
    MatTableModule,
    MatProgressSpinnerModule,
    SpanCopyComponent,
    DatePipe,
    GridDirective,
  ],
  templateUrl: './instance-snapshot-details.component.html',
  styleUrl: './instance-snapshot-details.component.scss',
})
export class InstanceSnapshotDetailsComponent {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected instanceSnapshotSvc = inject(InstanceSnapshotService);
  protected instanceSvc = inject(InstanceService);
  protected snapshotSvc = inject(SnapshotService);
  protected clipboard = inject(Clipboard);
  protected router = inject(Router);

  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  protected readonly supportEmail = environment.supportEmail;
  BannerLevelEnum = BannerLevelEnum;
  az = computed(() => {
    return this.routeParams()?.['az'];
  });

  canProjectSnapshotWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSnapshotWrite)
  );
  canProjectInstanceWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceWrite)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  routeParams;
  instanceSnapshotProduct;
  instanceProduct;
  diskSnapshotProduct;

  isPRA = computed(() => {
    if (this.instanceSnapshotProduct.hasValue()) {
      if (this.instanceSnapshotProduct.value().vmSnapshot?.metadata.labels) {
        return Object.keys(this.instanceSnapshotProduct.value().vmSnapshot!.metadata.labels!).some(v =>
          PRA_LABEL_KEYS.includes(v)
        );
      }
    }

    return false;
  });

  productLabelInfo = computed(() => {
    if (this.instanceSnapshotProduct.hasValue()) {
      return getProductLabelInfo(this.instanceSnapshotProduct.value().vmSnapshot?.metadata?.labels);
    }
    return getProductLabelInfo();
  });

  constructor() {
    const stateSvc = this.stateSvc;
    const instanceSnapshotSvc = this.instanceSnapshotSvc;
    const route = inject(ActivatedRoute);

    this.routeParams = toSignal(route.params);
    this.instanceSnapshotProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.routeParams()]),
      stream: () => {
        const az = this.routeParams()?.['az'];
        const id = this.routeParams()?.['id'];

        if (stateSvc.organization() && stateSvc.project() && id) {
          return instanceSnapshotSvc.get(stateSvc.organization()!.id, stateSvc.project()!.id, az, id);
        } else {
          return of();
        }
      },
    });

    this.instanceProduct = rxResource({
      params: () =>
        this.instanceSnapshotProduct.hasValue()
          ? this.instanceSnapshotProduct.value()?.vmSnapshot?.spec.source.name
          : undefined,
      stream: ({ params }) => {
        const instanceEid = params;
        if (instanceEid) {
          return this.instanceSvc.get(
            this.stateSvc.organization()!.id,
            this.stateSvc.project()!.id,
            this.az(),
            instanceEid
          );
        } else {
          return EMPTY;
        }
      },
    });

    this.diskSnapshotProduct = rxResource({
      params: () =>
        this.instanceSnapshotProduct.hasValue()
          ? this.instanceSnapshotProduct.value()?.vmSnapshotContent?.volumesSnapshot
          : undefined,
      stream: ({ params }) => {
        const snapshotsEid: string[] = [];
        params.forEach(v => {
          snapshotsEid.push(v);
        });

        if (snapshotsEid.length > 0) {
          const obs: Observable<ProductSnapshot>[] = [];
          snapshotsEid.forEach(v => {
            obs.push(this.snapshotSvc.get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az(), v));
          });
          return forkJoin(obs);
        } else {
          return of([]);
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
    const url = `https://${window.location.host}/redirect/${this.stateSvc.organization()?.id}/${this.stateSvc.project()?.id}/${this.az()}/vmSnapshot/${this.routeParams()?.['id']}`;
    this.copy(url);
  }

  restore() {
    const snapshot = this.instanceSnapshotProduct.value();
    if (this.az() && snapshot) {
      InstanceSnapshotActions.restoreSnapshot(
        this.instanceSnapshotSvc,
        this.stateSvc,
        this.dialog,
        this.router,
        this.az(),
        snapshot,
        this.instanceProduct.hasValue() ? this.instanceProduct.value()!.productName : undefined,
        this.instanceProduct.hasValue() ? this.instanceProduct.value()!.id : undefined
      );
    }
  }

  clone() {
    const snapshot = this.instanceSnapshotProduct.value();
    if (this.az() && snapshot) {
      InstanceSnapshotActions.cloneSnapshot(
        this.instanceSnapshotSvc,
        this.stateSvc,
        this.dialog,
        this.router,
        this.az(),
        snapshot,
        this.instanceProduct.hasValue() ? this.instanceProduct.value()!.productName : undefined
      );
    }
  }

  async openArgoCD() {
    const snapshot = this.instanceSnapshotProduct.value();
    if (snapshot) {
      await InstanceSnapshotActions.openArgoCD(this.instanceSnapshotSvc, this.stateSvc, this.az(), snapshot);
    }
  }

  deleteSnapshot() {
    const snapshot = this.instanceSnapshotProduct.value();
    if (this.az() && snapshot) {
      InstanceSnapshotActions.deleteSnapshot(
        this.instanceSnapshotSvc,
        this.stateSvc,
        this.dialog,
        this.az(),
        snapshot
      ).then(res => {
        if (res) {
          this.router.navigate(['/products', 'compute', 'instance-snapshot']);
        }
      });
    }
  }
}
