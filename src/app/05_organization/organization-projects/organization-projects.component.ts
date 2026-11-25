import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { OrganizationService } from '@shared/services/organization.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateProjectDialog } from '@shared/dialogs/create-project-dialog.component';
import { Project } from '@shared/models/data/organization';
import { MatMenuModule } from '@angular/material/menu';
import { UpdateProjectDialog } from '@shared/dialogs/update-project-dialog.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';

@Component({
  selector: 'spx-organization-projects',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    SpanCopyComponent,
  ],
  templateUrl: './organization-projects.component.html',
  styleUrl: './organization-projects.component.scss',
})
export class OrganizationProjectsComponent {
  protected stateSvc = inject(StateService);
  protected orgSvc = inject(OrganizationService);
  protected permissionSvc = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
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
