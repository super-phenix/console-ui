import { Component, computed, inject, ResourceRef, signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { InviteUserDialog, InviteUserDialogData } from '@shared/dialogs/invite-user-dialog.component';
import { Group } from '@shared/models/permissions/permission';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { OrganizationService } from '@shared/services/organization.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { map } from 'rxjs';

@Component({
  selector: 'spx-organization-users',
  imports: [MatButtonModule, MatSelectModule, MatIconModule, MatTableModule, MatFormFieldModule, MatInputModule],
  templateUrl: './organization-users.component.html',
  styleUrl: './organization-users.component.scss',
})
export class OrganizationUsersComponent {
  protected stateSvc = inject(StateService);
  protected orgSvc = inject(OrganizationService);
  protected permissionSvc = inject(PermissionService);

  private readonly dialog = inject(MatDialog);

  canOrganizationWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.OrganizationWrite));
  canOrganizationIAMWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.OrganizationIAMWrite)
  );
  groups: ResourceRef<Group[] | undefined>;

  displayedColumns: string[] = ['name', 'email', 'group', 'actions'];
  filterValue: WritableSignal<string> = signal('');
  dataSource = computed(() => {
    const orga = this.stateSvc.organization();

    const users = [...(orga?.users || [])];
    if (orga?.owner) {
      if (users.findIndex(u => u.user.id === orga.ownerId) === -1) {
        users.unshift({
          user: orga.owner,
          groups: [],
          owner: true,
        });
      }
    }

    const dataSource = new MatTableDataSource(users);
    // Override filterPredicate to use nested object
    dataSource.filterPredicate = (data, filter) => {
      const dataStr = JSON.stringify(data).toLowerCase();
      return dataStr.indexOf(filter) != -1;
    };
    dataSource.filter = this.filterValue();

    return dataSource;
  });

  constructor() {
    this.groups = rxResource({
      params: this.stateSvc.organization,
      stream: () => {
        return this.permissionSvc
          .getListGroup(this.stateSvc.organization()!.id)
          .pipe(map(r => r.sort((a, b) => a.name.localeCompare(b.name))));
      },
    });
  }

  updateFilter(value: string) {
    this.filterValue.set(value.trim().toLowerCase());
  }

  async invite() {
    const groups = this.groups.value();
    const dialogRef = this.dialog.open(InviteUserDialog, {
      data: {
        groups,
      },
    });
    dialogRef.afterClosed().subscribe((res: InviteUserDialogData) => {
      if (res) {
        this.orgSvc.inviteToOrg(this.stateSvc.organization()!.id, res.inviteCode, res.groups);
      }
    });
  }

  updateGroup(inviteCode: string, newGroup: string[], oldGroup: string[]) {
    if (this.stateSvc.organization() && !this.compareArrays(newGroup, oldGroup)) {
      this.orgSvc.inviteToOrg(this.stateSvc.organization()!.id, inviteCode, newGroup);
    }
  }

  removeUser(userId: string) {
    if (this.stateSvc.organization()) {
      this.orgSvc.removeFromOrg(this.stateSvc.organization()!.id, userId);
    }
  }

  private compareArrays(a: string[], b: string[]) {
    return a.length === b.length && a.every((element, index) => element === b[index]);
  }
}
