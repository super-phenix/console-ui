import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TabsBase } from '@products/00_shared/components/tabs-base/tab-base.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import {
  TransferOrganizationDialog,
  TransferOrgDialogData,
} from '@shared/dialogs/transfert-organization-dialog.component';
import { UpdateOrganizationDialog } from '@shared/dialogs/update-organization-dialog.component';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { AuthService } from '@shared/services/auth.service';
import { OrganizationService, SaveOrganizationBody } from '@shared/services/organization.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { OrganizationDetailsComponent } from '../organization-details/organization-details.component';
import { OrganizationIamComponent } from '../organization-iam/organization-iam.component';
import { OrganizationProjectsComponent } from '../organization-projects/organization-projects.component';
import { OrganizationUsersComponent } from '../organization-users/organization-users.component';

@Component({
  selector: 'spx-organization-settings',
  imports: [
    MatTabsModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    OrganizationDetailsComponent,
    OrganizationProjectsComponent,
    OrganizationUsersComponent,
    OrganizationIamComponent,
    ContentHeaderComponent,
    SpanCopyComponent,
    DecimalPipe,
  ],
  templateUrl: './organization-settings.component.html',
  styleUrl: './organization-settings.component.scss',
})
export class OrganizationSettingsComponent extends TabsBase {
  protected stateSvc = inject(StateService);
  protected orgSvc = inject(OrganizationService);
  protected permissionSvc = inject(PermissionService);
  protected auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  canOrganizationWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.OrganizationWrite));
  canOrganizationIAMRead = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.OrganizationIAMRead)
  );

  canOrganizationProjectManagement = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.OrganizationProjectManagement)
  );

  isOwner = computed(() => {
    if (this.stateSvc.organization() && this.auth.user()) {
      return this.stateSvc.organization()?.ownerId === this.auth.user()?.id;
    } else {
      return false;
    }
  });

  edit() {
    const dialogRef = this.dialog.open(UpdateOrganizationDialog, {
      data: {
        name: this.stateSvc.organization()?.name,
        administrativeContact: this.stateSvc.organization()?.administrativeContact,
        billingContact: this.stateSvc.organization()?.billingContact,
        technicalContact: this.stateSvc.organization()?.technicalContact,
      },
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const body: SaveOrganizationBody = {
          name: res.name,
          administrativeContact: res.administrativeContact,
          billingContact: res.billingContact,
          technicalContact: res.technicalContact,
        };

        this.orgSvc.saveOrganization(this.stateSvc.organization()!.id, body);
      }
    });
  }

  async transferOrg() {
    const dialogRef = this.dialog.open(TransferOrganizationDialog);
    dialogRef.afterClosed().subscribe((res: TransferOrgDialogData) => {
      if (res) {
        this.orgSvc.transferOrg(this.stateSvc.organization()!.id, res.id).then(() => {
          this.auth.reloadUser();
          this.router.navigate(['/dashboard']);
        });
      }
    });
  }

  deleteOrg() {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title: `Deletion`,
        html: `
        <span>Are you sure you want to delete this organization?</span>
        <br>
        <br>
        <span><i>Delete the organization along with all associated products, projects and information</i></span>
        <br>
        <span class="color-error"> <i> This action is irreversible. </i> </span>
        `,
      },
    });
    ref.afterClosed().subscribe(res => {
      if (res === true) {
        this.orgSvc.deleteOrganization(this.stateSvc.organization()!.id).subscribe(() => {
          this.auth.reloadUser();
          this.router.navigate(['/dashboard']);
        });
      }
    });
  }
}
