import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ENDPOINT, HTTP_PROTOCOL, environment } from '@env/environment';
import { firstValueFrom, Subject } from 'rxjs';
import { defaultOnceHandler } from '../http/customHandler';
import { Organization } from '../models/data/organization';

export interface SaveOrganizationBody {
  name: string;
  administrativeContact?: string | null;
  billingContact?: string | null;
  technicalContact?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  protected http = inject(HttpClient);

  needRefresh = new Subject<void>();

  getOrg(orgId: string) {
    return this.http.get<Organization>(this.getBaseUrl(orgId)).pipe(defaultOnceHandler());
  }

  async inviteToOrg(orgId: string, inviteCode: string, groupIds: string[]) {
    await firstValueFrom(
      this.http
        .post(`${this.getBaseUrl(orgId)}/iam/invite`, {
          userInviteCode: inviteCode,
          groupIds: groupIds,
        })
        .pipe(defaultOnceHandler())
    );

    this.needRefresh.next();
  }

  async transferOrg(orgId: string, newOwnerInviteCode: string) {
    await firstValueFrom(
      this.http.post(`${this.getBaseUrl(orgId)}/transfer`, { newOwnerInviteCode }).pipe(defaultOnceHandler())
    );

    this.needRefresh.next();
  }

  async removeFromOrg(orgId: string, userId: string) {
    await firstValueFrom(
      this.http
        .delete(`${this.getBaseUrl(orgId)}/iam/invite`, {
          params: new HttpParams().set('userId', userId),
        })
        .pipe(defaultOnceHandler())
    );

    this.needRefresh.next();
  }

  async saveOrganization(orgId: string, body: SaveOrganizationBody) {
    await firstValueFrom(this.http.post(`${this.getBaseUrl(orgId)}`, body).pipe(defaultOnceHandler()));

    this.needRefresh.next();
  }

  createOrganization(name: string) {
    return this.http
      .post(`${HTTP_PROTOCOL}${environment.apiUrl}${API_ENDPOINT}/organization`, {
        name: name,
      })
      .pipe(defaultOnceHandler());
  }

  deleteOrganization(orgId: string) {
    return this.http.delete(`${this.getBaseUrl(orgId)}`).pipe(defaultOnceHandler());
  }

  async createOrUpdateProject(orgId: string, projectName: string, projectId?: string) {
    await firstValueFrom(
      this.http
        .post(`${this.getBaseUrl(orgId)}/project`, {
          name: projectName,
          id: projectId,
        })
        .pipe(defaultOnceHandler())
    );
    this.needRefresh.next();
  }

  async deleteProject(orgaId: string, projectId: string) {
    await firstValueFrom(
      this.http
        .delete(`${this.getBaseUrl(orgaId)}/project`, {
          params: new HttpParams().set('projectId', projectId),
        })
        .pipe(defaultOnceHandler())
    );
    this.needRefresh.next();
  }

  private getBaseUrl(orgId: string) {
    return `${HTTP_PROTOCOL}${environment.apiUrl}${API_ENDPOINT}/organization/${orgId}`;
  }
}
