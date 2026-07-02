import { Clipboard } from '@angular/cdk/clipboard';
import { KeyValuePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DiskActions } from '../disk-actions.utils';
import { DiskService } from '@products/00_shared/services/disk.service';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { SnapshotService } from '@products/00_shared/services/snapshot.service';
import { isClusterResource } from '@products/00_shared/utils/cluster-utils';
import { getProductLabelInfo } from '@products/00_shared/utils/product-label-utils';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { PRA_LABEL_KEYS, REPLICATION_ANNOTATION_KEYS } from '@shared/models/consts';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';
import { environment } from '@env/environment';

interface DiskStatus {
  isPRA: boolean;
  isReplicated: boolean;
}

@Component({
  selector: 'spx-disk-details',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ContentHeaderComponent,
    KeyValuePipe,
    MatMenuModule,
    MatDividerModule,
    MatChipsModule,
    RouterLink,
    BannerComponent,
    SpanCopyComponent,
    GridDirective,
  ],
  templateUrl: './disk-details.component.html',
  styleUrl: './disk-details.component.scss',
})
export class DiskDetailsComponent {
  protected readonly DataVolumeTooSmall = 'DataVolume too small to contain image';

  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected diskSvc = inject(DiskService);
  protected snapshotSvc = inject(SnapshotService);
  protected instanceSvc = inject(InstanceService);
  protected clipboard = inject(Clipboard);
  protected router = inject(Router);

  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  protected readonly supportEmail = environment.supportEmail;
  BannerLevelEnum = BannerLevelEnum;
  az = computed(() => {
    return this.routeParams()?.['az'];
  });

  canProjectDiskWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectDiskWrite));
  canProjectSnapshotWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSnapshotWrite)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  runningStatus = computed(() => {
    return this.diskProduct.hasValue()
      ? this.diskProduct.value().disk?.status.conditions?.find(c => c.type === 'Running')
      : undefined;
  });

  routeParams;
  diskProduct;
  instanceProduct;

  instanceStatus = computed(() => {
    if (this.instanceProduct.hasValue()) {
      const instance = this.instanceProduct.value();
      const status =
        (instance.vmi && instance.vmi?.status?.phase
          ? instance.vmi!.status.phase
          : instance.vm?.status?.printableStatus) || 'unknown';
      return status;
    } else {
      return 'unknown';
    }
  });

  diskStatus = computed<DiskStatus>(() => {
    let isPRA = false;
    let isReplicated = false;
    if (this.diskProduct.hasValue()) {
      const labels = this.diskProduct.value().pvc?.metadata.labels;
      if (labels) {
        const labelKeys = Object.keys(labels);
        isPRA = labelKeys.some(v => PRA_LABEL_KEYS.includes(v));
      }

      const annotations = this.diskProduct.value().pvc?.metadata.annotations;
      if (annotations) {
        const keys = Object.keys(annotations);
        isReplicated = keys.some(v => REPLICATION_ANNOTATION_KEYS.includes(v));
      }
    }

    return { isPRA, isReplicated };
  });

  isClusterInstance = computed(() => {
    if (this.instanceProduct.hasValue()) {
      return isClusterResource(this.instanceProduct.value()?.vm?.metadata.labels);
    } else {
      return false;
    }
  });

  productLabelInfo = computed(() => {
    if (this.diskProduct.hasValue()) {
      return getProductLabelInfo(this.diskProduct.value().disk?.metadata?.labels);
    }
    return getProductLabelInfo();
  });

  private needReload = signal(0);

  constructor() {
    const route = inject(ActivatedRoute);

    this.routeParams = toSignal(route.params);
    this.diskProduct = rxResource({
      params: computed(() => [
        this.stateSvc.project(),
        this.stateSvc.organization(),
        this.routeParams(),
        this.needReload(),
      ]),
      stream: () => {
        const az = this.routeParams()?.['az'];
        const id = this.routeParams()?.['id'];

        if (this.stateSvc.organization() && this.stateSvc.project() && id) {
          return this.diskSvc.get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, az, id);
        } else {
          return of();
        }
      },
    });

    this.instanceProduct = rxResource({
      params: () => (this.diskProduct.hasValue() ? this.diskProduct.value() : undefined),
      stream: ({ params }) => {
        const az = this.routeParams()?.['az'];
        if (params && params.mountStatus?.by && this.stateSvc.organization() && this.stateSvc.project()) {
          return this.instanceSvc.get(
            this.stateSvc.organization()!.id,
            this.stateSvc.project()!.id,
            az,
            params.mountStatus.by
          );
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
    const url = `https://${window.location.host}/redirect/${this.stateSvc.organization()?.id}/${this.stateSvc.project()?.id}/${this.az()}/disk/${this.routeParams()?.['id']}`;
    this.copy(url);
  }

  protected readonly DiskActions = DiskActions;

  unmount() {
    if (this.diskProduct.hasValue()) {
      DiskActions.unmountDisk(this.diskSvc, this.stateSvc, this.dialog, this.az(), this.diskProduct.value()).then(
        res => {
          if (res) {
            this.needReload.update(v => v + 1);
          }
        }
      );
    }
  }

  createSnapshot() {
    if (this.diskProduct.hasValue()) {
      DiskActions.createSnapshot(this.router, this.az(), this.diskProduct.value());
    }
  }

  openArgoCD() {
    if (this.diskProduct.hasValue()) {
      DiskActions.openArgoCD(this.diskSvc, this.stateSvc, this.az(), this.diskProduct.value());
    }
  }

  deleteDisk() {
    if (this.diskProduct.hasValue()) {
      DiskActions.deleteDisk(this.diskSvc, this.stateSvc, this.dialog, this.az(), this.diskProduct.value()).then(
        res => {
          if (res) {
            this.router.navigate(['/products', 'storage', 'disk']);
          }
        }
      );
    }
  }
}
