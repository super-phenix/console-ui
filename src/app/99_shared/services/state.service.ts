import { DestroyRef, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { OrganizationService } from './organization.service';
import { Organization, Project } from '../models/data/organization';
import { debounceTime, firstValueFrom, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getUserOrganization, User } from '@shared/models/data/user';
import { PermissionService } from './permission.service';
import { AZService } from '@products/00_shared/services/az.service';
import { AZ } from '@products/00_shared/models/product.model';

const OrgLocalStorageKey = 'org';
const ProjectLocalStorageKey = 'project';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private orgSvc = inject(OrganizationService);
  private permissionSvc = inject(PermissionService);
  private azSvc = inject(AZService);

  private destroyRef = inject(DestroyRef);

  organization: WritableSignal<Organization | undefined> = signal(undefined);
  project: WritableSignal<Project | undefined> = signal(undefined);
  azList: WritableSignal<AZ[]> = signal([]);

  stateChanged = new Subject<void>();

  constructor() {
    const orgSvc = this.orgSvc;

    orgSvc.needRefresh.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.reloadOrganization();
    });

    this.stateChanged.pipe(takeUntilDestroyed(this.destroyRef), debounceTime(20)).subscribe(() => {
      if (this.organization()) {
        //  Update cached state
        this.updateStateCache();
        //  Reload permissions
        this.permissionSvc.loadPermissions(this.organization()!.id, this.project()?.id);
      }

      return;
    });
  }

  /**
   * Setup state service for a connected User
   * @param user the newly connected user
   */
  onLogin(user: User) {
    const orgs = getUserOrganization(user);
    const cacheOrg = localStorage.getItem(OrgLocalStorageKey);
    if (cacheOrg && orgs.some(org => org.id === cacheOrg)) {
      this.setOrganization(cacheOrg);
    } else if (user && user!.personalOrg.length > 0) {
      const firstOrg = user.personalOrg[0].id;
      this.setOrganization(firstOrg);
    }
  }

  async setOrganization(orgId: string, forceRefresh = false) {
    if (orgId === '') {
      return;
    }

    if (!forceRefresh && this.organization()?.id === orgId) {
      return;
    }

    const org = await firstValueFrom(this.orgSvc.getOrg(orgId));
    this.organization.set(org);

    //  Load AZ list for the selected organization
    firstValueFrom(this.azSvc.listAZs(orgId)).then(azList => this.azList.set(azList));

    //  Update project
    const cacheProject = localStorage.getItem(ProjectLocalStorageKey);
    if (org.projects && org.projects.length > 0) {
      if (cacheProject && org.projects.some(p => p.id === cacheProject)) {
        this.setProject(cacheProject);
      } else {
        const foundProject = org.projects.some(v => v.id === this.project()?.id);
        if (!foundProject) {
          this.setProject(org.projects[0].id);
        }
      }
    }

    this.stateChanged.next();
  }

  setProject(projectId: string) {
    if (this.organization()) {
      const org = this.organization()!;
      const project = org.projects.find(v => v.id === projectId);
      this.project.set(project);
      this.stateChanged.next();
    }
  }

  private reloadOrganization() {
    if (this.organization()) {
      this.setOrganization(this.organization()!.id, true);
    }
  }

  private updateStateCache() {
    localStorage.setItem(OrgLocalStorageKey, this.organization()?.id || '');
    localStorage.setItem(ProjectLocalStorageKey, this.project()?.id || '');
  }
}
