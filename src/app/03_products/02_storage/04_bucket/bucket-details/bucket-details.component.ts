import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BucketActions } from '../bucket-actions.utils';
import { BucketDetailsConfigComponent } from './bucket-details-config/bucket-details-config.component';
import { BucketDetailsConnectComponent } from './bucket-details-connect/bucket-details-connect.component';
import { BucketDetailsGeneralComponent } from './bucket-details-general/bucket-details-general.component';
import { TabsBase } from '@products/00_shared/components/tabs-base/tab-base.component';
import { BucketService } from '@products/00_shared/services/bucket.service';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'spx-bucket-details',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    RouterLink,
    ContentHeaderComponent,
    BannerComponent,
    BucketDetailsGeneralComponent,
    BucketDetailsConnectComponent,
    BucketDetailsConfigComponent,
  ],
  templateUrl: './bucket-details.component.html',
  styleUrl: './bucket-details.component.scss',
})
export class BucketDetailsComponent extends TabsBase {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected bucketSvc = inject(BucketService);
  private readonly clipboard = inject(Clipboard);

  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  protected readonly supportEmail = environment.supportEmail;
  BannerLevelEnum = BannerLevelEnum;

  az = computed(() => {
    return this.routeParams()?.['az'];
  });

  canProjectBucketWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectBucketWrite));
  canProjectBucketCredentials = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectBucketCredentials)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  routeParams;
  bucketProduct;

  private needReload = signal(0);

  constructor() {
    super();
    const route = inject(ActivatedRoute);

    this.routeParams = toSignal(route.params);
    this.bucketProduct = rxResource({
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
          return this.bucketSvc.get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, az, id);
        } else {
          return of();
        }
      },
    });
  }

  reload() {
    this.needReload.update(v => v + 1);
  }

  copyShareLink() {
    const url = `https://${window.location.host}/redirect/${this.stateSvc.organization()?.id}/${this.stateSvc.project()?.id}/${this.az()}/bucket/${this.routeParams()?.['id']}`;
    this.clipboard.copy(url);
    this.snackbar.open('Copy to clipboard!', undefined, {
      horizontalPosition: 'end',
      duration: 3000,
    });
  }

  openArgoCD() {
    if (this.bucketProduct.hasValue()) {
      BucketActions.openArgoCD(this.bucketSvc, this.stateSvc, this.az(), this.bucketProduct.value());
    }
  }

  deleteBucket() {
    if (this.bucketProduct.hasValue()) {
      BucketActions.deleteBucket(this.bucketSvc, this.stateSvc, this.dialog, this.az(), this.bucketProduct.value()).then(
        res => {
          if (res) {
            this.router.navigate(['/products', 'storage', 'bucket']);
          }
        }
      );
    }
  }
}
