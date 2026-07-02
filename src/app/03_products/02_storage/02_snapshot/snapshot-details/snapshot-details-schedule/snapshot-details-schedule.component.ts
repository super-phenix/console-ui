import { Clipboard } from '@angular/cdk/clipboard';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductSnapshot } from '@products/00_shared/models/product.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { getProductLabelInfo } from '@products/00_shared/utils/product-label-utils';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';

@Component({
  selector: 'spx-snapshot-details-schedule',
  imports: [MatChipsModule, MatIconModule, MatButtonModule, SpanCopyComponent, GridDirective, DatePipe, KeyValuePipe],
  templateUrl: './snapshot-details-schedule.component.html',
  styleUrl: './snapshot-details-schedule.component.scss',
})
export class SnapshotDetailsScheduleComponent {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected diskSvc = inject(DiskService);
  protected clipboard = inject(Clipboard);
  private readonly snackbar = inject(MatSnackBar);

  az = input.required<string>();
  snapshotResource = input.required<ProductSnapshot>();

  canProjectSnapshotWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSnapshotWrite)
  );

  productLabelInfo = computed(() => getProductLabelInfo(this.snapshotResource().snapshotSchedule?.metadata?.labels));

  scheduleDayInterval = computed(() => {
    const schedule = this.snapshotResource().snapshotSchedule?.spec?.schedule;
    if (!schedule) return null;
    const match = schedule.match(/\*\/(\d+)/);
    return match ? match[1] : null;
  });

  copy(value: string) {
    this.clipboard.copy(value);
    this.snackbar.open('Copy to clipboard!', undefined, {
      horizontalPosition: 'end',
      duration: 3000,
    });
  }
}
