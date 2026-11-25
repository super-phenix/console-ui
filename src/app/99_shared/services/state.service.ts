import { DestroyRef, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { OrganizationService } from './organization.service';
import { compareByName, Organization, Project } from '../models/data/organization';
import { debounceTime, firstValueFrom, Subject, tap } from 'rxjs';
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

  private lastRequest = 0;
  private appliedRequest = 0;

  organization: WritableSignal<Organization | undefined> = signal(undefined);
  project: WritableSignal<Project | undefined> = signal(undefined);
  azList: WritableSignal<AZ[]> = signal([]);

  stateChanged = new Subject<void>();

  constructor() {
    const orgSvc = this.orgSvc;

    orgSvc.needRefresh.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.reloadOrganization();
    });

    this.stateChanged.pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(() => this.permissionSvc.invalidate()),
      debounceTime(20),
    ).subscribe(() => {
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

  /**
   * Switches to the organization. Resolves to false, keeping the current one, when it cannot be loaded
   * or when a more recent switch was applied meanwhile (e.g. a redirect racing with the one of `onLogin`).
   */
  async setOrganization(orgId: string, forceRefresh = false): Promise<boolean> {
    if (orgId === '') {
      return false;
    }

    const request = ++this.lastRequest;
    if (!forceRefresh && this.organization()?.id === orgId) {
      this.appliedRequest = request;
      return true;
    }

    // The errors interceptor already tells the user why it failed.
    const fetched = await firstValueFrom(this.orgSvc.getOrg(orgId)).catch(() => undefined);
    if (!fetched || request < this.appliedRequest) {
      return false;
    }
    this.appliedRequest = request;
    const org = { ...fetched, projects: [...(fetched.projects ?? [])].sort(compareByName) };
    this.organization.set(org);

    //  Load AZ list for the selected organization
    firstValueFrom(this.azSvc.listAZs(orgId)).then(azList => {
      if (this.organization()?.id === orgId) {
        this.azList.set(azList);
      }
    });

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
    return true;
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
