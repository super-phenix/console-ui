import { Clipboard } from '@angular/cdk/clipboard';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { ProductSnapshot } from '@products/00_shared/models/product.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { getProductLabelInfo } from '@products/00_shared/utils/product-label-utils';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'spx-snapshot-details-single',
  imports: [
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    SpanCopyComponent,
    RouterLink,
    GridDirective,
    DatePipe,
    KeyValuePipe,
  ],
  templateUrl: './snapshot-details-single.component.html',
  styleUrl: './snapshot-details-single.component.scss',
})
export class SnapshotDetailsSingleComponent {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected diskSvc = inject(DiskService);
  protected clipboard = inject(Clipboard);
  private readonly snackbar = inject(MatSnackBar);

  az = input.required<string>();
  snapshotResource = input.required<ProductSnapshot>();

  diskProduct = rxResource({
    params: () => this.snapshotResource().snapshot?.spec.source.persistentVolumeClaimName,
    stream: ({ params }) => {
      const diskEid = params;
      if (diskEid) {
        return this.diskSvc.get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az(), diskEid);
      } else {
        return EMPTY;
      }
    },
  });

  canProjectSnapshotWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSnapshotWrite)
  );

  productLabelInfo = computed(() => getProductLabelInfo(this.snapshotResource().snapshot?.metadata?.labels));

  copy(value: string) {
    this.clipboard.copy(value);
    this.snackbar.open('Copy to clipboard!', undefined, {
      horizontalPosition: 'end',
      duration: 3000,
    });
  }
}
