import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdvancedOptions } from '@products/00_shared/models/compute/instance/advanced-options.model';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { BannerLevelEnum } from '@shared/models/enums';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom, of } from 'rxjs';
import { InstanceTypeSettingsDialogComponent } from '../../instance-create/dialogs/instance-type-settings-dialog.component';
import { AdvancedBlocksComponent } from '../../instance-create/instance-advanced-create/advanced-blocks/advanced-blocks.component';

@Component({
  selector: 'spx-instance-details-advanced',
  imports: [MatProgressSpinnerModule, MatIconModule, MatButtonModule, BannerComponent, AdvancedBlocksComponent],
  templateUrl: './instance-details-advanced.component.html',
  styleUrl: './instance-details-advanced.component.scss',
})
export class InstanceDetailsAdvancedComponent {
  protected stateSvc = inject(StateService);
  protected instanceSvc = inject(InstanceService);
  private dialog = inject(MatDialog);
  protected BannerLevelEnum = BannerLevelEnum;

  effectiveId = input.required<string>();
  az = input.required<string>();
  /** Instance type name backing the "View instance type settings" button. */
  instanceTypeName = input<string | undefined>(undefined);

  advancedResource = rxResource({
    params: () => ({ eid: this.effectiveId(), az: this.az() }),
    stream: ({ params: { eid, az } }) => {
      const org = this.stateSvc.organization();
      const project = this.stateSvc.project();
      if (org && project && eid && az) {
        return this.instanceSvc.getAdvancedOptions(org.id, project.id, az, eid);
      }
      return of(undefined);
    },
  });

  /** Options whose running value differs from the saved one (a restart applies them). */
  staleCount = computed<number>(() => {
    const a = this.advancedResource.value() as AdvancedOptions | undefined;
    if (!a) return 0;
    return a.blocks.reduce(
      (n, b) => n + (b.enabled.stale ? 1 : 0) + b.fields.filter(f => f.stale).length,
      0
    );
  });

  /** Open the read-only modal with the full instance type spec. */
  openInstanceTypeSettings(): void {
    const name = this.instanceTypeName();
    if (!name) return;
    this.dialog.open(InstanceTypeSettingsDialogComponent, {
      data: { instanceTypeName: name, az: this.az() },
      panelClass: 'dialog--large',
    });
  }

  /** Restart the VM (with confirmation) to apply options pending a reboot, then reload. */
  restart(): void {
    const org = this.stateSvc.organization();
    const project = this.stateSvc.project();
    if (!org || !project) return;

    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Restart instance?',
        html: '<p>Restart this VM now to apply the saved advanced options? The instance will reboot.</p>',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed !== true) return;
      firstValueFrom(this.instanceSvc.restartVM(org.id, project.id, this.az(), this.effectiveId())).then(() =>
        this.advancedResource.reload()
      );
    });
  }
}
