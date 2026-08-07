import { Component, computed, inject, ResourceRef, signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TagOption, TagSelectorComponent } from '@shared/components/tag-selector/tag-selector.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { DuplicateGroupData, DuplicateGroupDialog } from '@shared/dialogs/duplicate-group-dialog.component';
import { MAX_NAME_LENGTH, NIL_UUID } from '@shared/models/consts';
import { Project } from '@shared/models/data/organization';
import { EntityTypeEnum, Group, PermissionSetMap } from '@shared/models/permissions/permission';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { catchError, firstValueFrom, map } from 'rxjs';

interface FormControlWithName {
  formControl: FormControl;
  name: string;
}

const NEW_ID = '__new';

@Component({
  selector: 'spx-organization-iam',
  imports: [
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatIconModule,
    TagSelectorComponent,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  templateUrl: './organization-iam.component.html',
  styleUrl: './organization-iam.component.scss',
})
export class OrganizationIamComponent {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);

  canOrganizationIAMWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.OrganizationIAMWrite)
  );

  /** Predefined groups are realigned on the platform catalog, the API refuses any edit on them. */
  isPredefined = computed(() => !!this.currentGroup()?.predefinedKey);
  canEditCurrentGroup = computed(() => this.canOrganizationIAMWrite() && !this.isPredefined());
  canDuplicateCurrentGroup = computed(
    () => this.canOrganizationIAMWrite() && !!this.currentGroup() && this.currentGroup()!.id !== NEW_ID
  );

  predefinedGroups = computed(() => this.groups.value()?.filter(g => g.predefinedKey) ?? []);
  customGroups = computed(() => this.groups.value()?.filter(g => !g.predefinedKey) ?? []);

  readonly EntityTypeEnum = EntityTypeEnum;
  readonly maxLength = MAX_NAME_LENGTH;
  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);

  groups: ResourceRef<Group[] | undefined>;

  currentGroup: WritableSignal<Group | undefined> = signal(undefined);
  formControlMap = new Map<string, FormControlWithName[]>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formArray: FormArray = new FormArray<any>([]);
  nameInput = new FormControl('', [Validators.required]);

  groupProjects: TagOption[] = [];
  groupProjectsChanged = false;
  projects: Project[] = [];

  constructor() {
    const stateSvc = this.stateSvc;

    this.groups = rxResource({
      params: this.stateSvc.organization,
      stream: () => {
        return this.permissionSvc
          .getListGroup(this.stateSvc.organization()!.id)
          .pipe(map(r => r.sort((a, b) => a.name.localeCompare(b.name))));
      },
    });
    this.projects = stateSvc.organization() ? stateSvc.organization()!.projects : [];
    this.init();
  }

  async init() {
    const res = await firstValueFrom(this.permissionSvc.getPermissionSets(this.stateSvc.organization()!.id));
    this.initForm(res);
    if (this.currentGroup()?.id) {
      this.groupSelected(this.currentGroup()!.id);
    }
  }

  groupSelected(id: string) {
    if (id && this.groups.hasValue()) {
      const index = this.groups.value()!.findIndex(v => v.id === id);
      if (index !== -1) {
        const group = this.groups.value()![index];
        this.currentGroup.set(group);

        this.formArray.clear();
        this.groupProjectsChanged = false;
        if (group.allProjects) {
          this.groupProjects = [{ id: '__all', name: '' }];
        } else {
          this.groupProjects = group.projectIds.map(id => {
            const name = this.projects.find(p => p.id === id)?.name || id;
            return { id, name } as Project;
          });
        }
        this.nameInput.reset(group.name);

        this.formControlMap.forEach(fcList => {
          fcList.forEach(fc => {
            fc.formControl.setValue(this.currentGroup()?.permissionSets?.includes(fc.name));
            this.formArray.push(fc.formControl);
          });
        });
        this.formArray.markAsPristine();

        if (this.canEditCurrentGroup()) {
          this.formArray.enable();
          this.nameInput.enable();
        } else {
          this.formArray.disable();
          this.nameInput.disable();
        }
      }
    }
  }

  groupProjectsChange(event: TagOption[]) {
    this.groupProjects = event;
    this.groupProjectsChanged = true;
  }

  initForm(permissionSetsByEntity: PermissionSetMap) {
    Object.entries(permissionSetsByEntity).forEach(([entity, pSets]: [string, string[]]) => {
      const controls: FormControlWithName[] = [];
      pSets.forEach(pSet => {
        controls.push({ formControl: new FormControl(), name: pSet });
      });

      this.formControlMap.set(
        entity,
        controls.sort((a, b) => a.name.localeCompare(b.name))
      );
    });
  }

  createGroup() {
    // Create a new group only if there isn't already one
    if (!this.groups.value()?.some(v => v.id === NEW_ID)) {
      const group: Group = {
        id: NEW_ID,
        name: '',
        allProjects: true,
        permissionSets: [],
        projectIds: [],
      };

      // A new array reference on every mutation, the predefined/custom lists derive from it.
      this.groups.update(g => (g ? [...g, group] : [group]));
    }
    this.groupSelected(NEW_ID);
  }

  cancel() {
    if (this.currentGroup()?.id) {
      this.groupSelected(this.currentGroup()!.id);
    }
  }

  save() {
    if (this.currentGroup()?.id && this.nameInput.valid && this.nameInput.value && this.canEditCurrentGroup()) {
      const group = this.currentGroup()!;

      const pSets: string[] = [];
      this.formControlMap.forEach(fcList => {
        fcList.forEach(fc => {
          if (fc.formControl.value === true) {
            pSets.push(fc.name);
          }
        });
      });

      group.permissionSets = pSets;
      group.name = this.nameInput.value;

      if (group.id === NEW_ID) {
        group.id = NIL_UUID;
      }

      if (this.groupProjects.length === 1 && this.groupProjects[0].id === '__all') {
        group.allProjects = true;
        group.projectIds = [];
      } else {
        group.allProjects = false;
        group.projectIds = this.groupProjects.map(p => p.id);
      }

      this.permissionSvc.updateGroup(this.stateSvc.organization()!.id, group).subscribe(res => {
        if (this.groups.hasValue()) {
          const groups = [...this.groups.value()!];
          const index = groups.findIndex(g => g.id === group.id);
          if (index !== -1) {
            groups[index] = res;
          } else {
            groups.push(res);
          }
          this.groups.set(groups);
          this.groupSelected(res.id);
        }
      });
    }
  }

  /** Copy the selected group into a new custom one, the only way to derive from a predefined role. */
  async duplicateGroup() {
    if (!this.canDuplicateCurrentGroup()) {
      return;
    }

    const source = this.currentGroup()!;
    const data: DuplicateGroupData = {
      sourceName: source.name,
      existingNames: this.groups.value()?.map(g => g.name) ?? [],
    };
    const ref = this.dialog.open(DuplicateGroupDialog, { data });
    const name = await firstValueFrom(ref.afterClosed());
    if (!name) {
      return;
    }

    this.permissionSvc
      .duplicateGroup(this.stateSvc.organization()!.id, source.id, name)
      .pipe(
        catchError(err => {
          this.snackbar.open(err.error, undefined, { duration: 5000, horizontalPosition: 'end' });
          throw err;
        })
      )
      .subscribe(res => {
        const groups = [...(this.groups.value() ?? []), res];
        this.groups.set(groups.sort((a, b) => a.name.localeCompare(b.name)));
        this.groupSelected(res.id);
      });
  }

  async deleteGroup() {
    if (this.currentGroup() && this.canEditCurrentGroup()) {
      const ref = this.dialog.open(ConfirmDialog, {
        data: {
          title: `Deletion`,
          content: `Are you sure you want to delete the group '${this.currentGroup()!.name}'?`,
        },
      });
      const res = await firstValueFrom(ref.afterClosed());
      if (res === true) {
        const currentId = this.currentGroup()!.id;
        // If it's a exsiting group
        if (currentId !== NEW_ID) {
          this.permissionSvc
            .deleteGroup(this.stateSvc.organization()!.id, currentId)
            .pipe(
              catchError(err => {
                this.snackbar.open(err.error, undefined, { duration: 5000, horizontalPosition: 'end' });
                throw err;
              })
            )
            .subscribe(() => this.removeFromGroupsList(currentId));
        } else {
          // If it's a new group
          this.removeFromGroupsList(currentId);
        }
      }
    }
  }

  private removeFromGroupsList(id: string) {
    const groups = this.groups.value()!.filter(g => g.id !== id);
    this.groups.set(groups);
    if (groups.length > 0) {
      this.groupSelected(groups[0].id);
    }
  }
}
