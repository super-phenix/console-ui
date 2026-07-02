import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { OrganizationService } from '@shared/services/organization.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CreateProjectDialog } from '@shared/dialogs/create-project-dialog.component';
import { Project } from '@shared/models/data/organization';
import { MatMenuModule } from '@angular/material/menu';
import { UpdateProjectDialog } from '@shared/dialogs/update-project-dialog.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'spx-organization-projects',
  imports: [MatButtonModule, MatIconModule, MatTableModule, MatFormFieldModule, MatInputModule, MatMenuModule],
  templateUrl: './organization-projects.component.html',
  styleUrl: './organization-projects.component.scss',
})
export class OrganizationProjectsComponent {
  protected stateSvc = inject(StateService);
  protected orgSvc = inject(OrganizationService);
  protected permissionSvc = inject(PermissionService);
  protected clipboard = inject(Clipboard);

  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  displayedColumns: string[] = ['name', 'id', 'actions'];
  filterValue: WritableSignal<string> = signal('');
  dataSource = computed(() => {
    const orga = this.stateSvc.organization();
    const dataSource = new MatTableDataSource(orga?.projects);
    // Override filterPredicate to use nested object
    dataSource.filterPredicate = (data, filter) => {
      const dataStr = JSON.stringify(data).toLowerCase();
      return dataStr.indexOf(filter) != -1;
    };
    dataSource.filter = this.filterValue();

    return dataSource;
  });

  updateFilter(value: string) {
    this.filterValue.set(value.trim().toLowerCase());
  }

  copy(value: string) {
    this.clipboard.copy(value);
    this.snackbar.open('Copied to clipboard!', undefined, {
      horizontalPosition: 'end',
      duration: 3000,
    });
  }

  createProject() {
    const dialogRef = this.dialog.open(CreateProjectDialog);
    dialogRef.afterClosed().subscribe((res: string) => {
      if (res) {
        this.orgSvc.createOrUpdateProject(this.stateSvc.organization()!.id, res);
      }
    });
  }

  async updateProject(project: Project) {
    const dialogRef = this.dialog.open(UpdateProjectDialog, {
      data: {
        name: project.name,
      },
    });
    dialogRef.afterClosed().subscribe((res: string) => {
      if (res) {
        this.orgSvc.createOrUpdateProject(this.stateSvc.organization()!.id, res, project.id);
      }
    });
  }

  deleteProject(project: Project) {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: `Deletion`,
        content: `Are you sure you want to delete the project '${project.name}'?`,
      },
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.orgSvc.deleteProject(this.stateSvc.organization()!.id, project.id);
      }
    });
  }
}
