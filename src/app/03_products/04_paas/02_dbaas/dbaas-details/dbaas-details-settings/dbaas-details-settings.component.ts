import { Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ProductDBaaS } from '@products/00_shared/models/product.model';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';

/**
 * Lifecycle actions of a database, kept apart from the day-to-day ones in the page header.
 * The page owns the confirm dialogs: this component only emits.
 */
@Component({
  selector: 'spx-dbaas-details-settings',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './dbaas-details-settings.component.html',
  styleUrl: './dbaas-details-settings.component.scss',
})
export class DBaaSDetailsSettingsComponent {
  protected permissionSvc = inject(PermissionService);

  db = input.required<ProductDBaaS>();
  restart = output<void>();
  delete = output<void>();

  canWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectDBaaSWrite));
  isGitops = computed(() => this.db().gitops === 'true');
}
