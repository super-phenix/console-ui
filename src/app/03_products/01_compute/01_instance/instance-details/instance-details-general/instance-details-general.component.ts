import { Clipboard } from '@angular/cdk/clipboard';
import { KeyValuePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ProductInstance } from '@products/00_shared/models/product.model';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { isClusterResource } from '@products/00_shared/utils/cluster-utils';
import { getProductLabelInfo } from '@products/00_shared/utils/product-label-utils';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { CUSTOM_USER_LABEL_PREFIX } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';

@Component({
  selector: 'spx-instance-details-general',
  imports: [MatChipsModule, KeyValuePipe, MatIconModule, MatButtonModule, SpanCopyComponent, GridDirective],
  templateUrl: './instance-details-general.component.html',
  styleUrl: './instance-details-general.component.scss',
})
export class InstanceDetailsGeneralComponent {
  protected instanceSvc = inject(InstanceService);
  protected permissionSvc = inject(PermissionService);
  protected stateSvc = inject(StateService);
  protected clipboard = inject(Clipboard);
  protected router = inject(Router);

  private readonly snackbar = inject(MatSnackBar);

  CUSTOM_USER_LABEL_PREFIX = CUSTOM_USER_LABEL_PREFIX;

  canProjectInstanceWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceWrite)
  );

  az = input.required<string>();
  instance = input.required<ProductInstance>();

  hasGuestAgent = computed(() => {
    if (this.instance() && this.instance().vmi?.status.conditions) {
      const agentStatus = this.instance().vmi?.status.conditions.find(cond => cond.type === 'AgentConnected');
      return !!agentStatus && agentStatus.status === 'True';
    }
    return null;
  });

  isClusterInstance = computed(() => isClusterResource(this.instance()?.vm?.metadata.labels));
  productLabelInfo = computed(() => getProductLabelInfo(this.instance()?.vm?.metadata?.labels));

  copy(value: string) {
    this.clipboard.copy(value);
    this.snackbar.open('Copy to clipboard!', undefined, {
      horizontalPosition: 'end',
      duration: 3000,
    });
  }
}
