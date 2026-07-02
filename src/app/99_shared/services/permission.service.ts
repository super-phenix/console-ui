import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal, WritableSignal, inject } from '@angular/core';
import { environment } from '@env/environment';
import { EntityTypeEnum, Group, PermissionListBody, PermissionSetMap } from '@shared/models/permissions/permission';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { combineLatest, firstValueFrom, Observable, ReplaySubject, timeout } from 'rxjs';
import { defaultOnceHandler } from '../http/customHandler';

interface CacheObject {
  permissions: string[];
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  protected http = inject(HttpClient);

  permissions: WritableSignal<string[]> = signal([]);
  // Map<key, timestamp>
  // key    : orgId_projectId
  // value  : CacheObject
  private cachedMap = new Map<string, CacheObject>();
  private cacheDuration = 60000 * 5; // 5 minutes

  private ready = new ReplaySubject<boolean>();
  isReady = this.ready.pipe(timeout(1500));

  /**
   * Load user permissions for a given entity
   * @param orgId
   * @param scope
   * @param entityId If not given, use organization ID
   *
   * Set the permissions list in `permissions` property
   */
  async loadPermissions(orgId: string, projectId?: string) {
    const key = `${orgId}_${projectId}`;
    if (this.checkCachedEntity(key)) {
      this.permissions.set(this.cachedMap.get(key)!.permissions);
      return;
    }

    this.permissions.set([]);

    const listObs: Observable<string[]>[] = [];
    const bodyOrg: PermissionListBody = { entityType: EntityTypeEnum.Organization, entityId: orgId };
    listObs.push(this.http.post<string[]>(`${this.getBaseUrl(orgId)}/permissions`, bodyOrg));

    if (projectId) {
      const bodyProject: PermissionListBody = { entityType: EntityTypeEnum.Project, entityId: projectId };
      listObs.push(this.http.post<string[]>(`${this.getBaseUrl(orgId)}/permissions`, bodyProject));
    }

    const result = await firstValueFrom(combineLatest(listObs));
    const flattenResult = result.flat();

    this.permissions.set(flattenResult);
    this.updateCache(key, flattenResult);
    this.ready.next(true);
  }

  canAccess(permission: PermissionsEnum) {
    return this.permissions().includes(permission);
  }

  /**
   * Get the list of role groups defined for an organization
   * @param orgaId
   * @returns
   */
  getListGroup(orgId: string) {
    return this.http.get<Group[]>(`${this.getBaseUrl(orgId)}/group`).pipe(defaultOnceHandler());
  }

  getPermissionSets(orgId: string) {
    return this.http.get<PermissionSetMap>(`${this.getBaseUrl(orgId)}/permissionSets`).pipe(defaultOnceHandler());
  }

  updateGroup(orgId: string, group: Group) {
    return this.http.post<Group>(`${this.getBaseUrl(orgId)}/group`, group).pipe(defaultOnceHandler());
  }

  deleteGroup(orgId: string, groupId: string) {
    return this.http
      .delete(`${this.getBaseUrl(orgId)}/group`, {
        params: new HttpParams().set('groupId', groupId),
      })
      .pipe(defaultOnceHandler());
  }

  /**
   * Check if we already cached permissions
   * @returns true if the same object is found in cache
   */
  private checkCachedEntity(key: string): boolean {
    const chacheObject = this.cachedMap.get(key);
    // If no cache
    if (!chacheObject) {
      return false;
    }

    // If cache expired
    if (chacheObject.timestamp + this.cacheDuration <= Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Update cached map
   */
  private updateCache(key: string, permissions: string[]) {
    this.cachedMap.set(key, {
      timestamp: Date.now(),
      permissions,
    });
  }

  private getBaseUrl(orgId: string) {
    return `${environment.url.http}/v1/organization/${orgId}/iam`;
  }
}
