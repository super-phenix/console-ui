import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ENDPOINT, HTTP_PROTOCOL, environment } from '@env/environment';
import { defaultOnceHandler } from '../http/customHandler';
import { IGNORE_ERROR_STATUSES } from '../interceptor/errors.interceptor';
import {
  OrganizationQuotaOverview,
  ProjectAZQuota,
  ProjectQuota,
  ProjectQuotaOverview,
  QuotaOrganizationUsage,
  QuotaProjectUsage,
  QuotaResources,
} from '../models/data/quota';

@Injectable({
  providedIn: 'root',
})
export class QuotaService {
  protected http = inject(HttpClient);

  /** Organization quota and its distribution to projects (`OrganizationProjectQuotaRead`) */
  getOrganizationQuota(orgId: string, context?: HttpContext) {
    const httpContext = this.ensureIgnore403(context);
    return this.http
      .get<OrganizationQuotaOverview>(`${this.getBaseUrl(orgId)}/quota`, { context: httpContext })
      .pipe(defaultOnceHandler());
  }

  /** Project quota and its distribution to AZs (`ProjectAZQuotaRead`) */
  getProjectQuota(orgId: string, projectId: string, context?: HttpContext) {
    const httpContext = this.ensureIgnore403(context);
    return this.http
      .get<ProjectQuotaOverview>(`${this.getBaseUrl(orgId)}/project/${projectId}/quota`, { context: httpContext })
      .pipe(defaultOnceHandler());
  }

  /** Current usage of the organization, per project and AZ (`OrganizationProjectQuotaRead`) */
  getOrganizationUsage(orgId: string, context?: HttpContext) {
    const httpContext = this.ensureIgnore403(context);
    return this.http
      .get<QuotaOrganizationUsage>(`${this.getBaseUrl(orgId)}/quota/usage`, { context: httpContext })
      .pipe(defaultOnceHandler());
  }

  /** Current usage of a project, per AZ (`ProjectAZQuotaRead`) */
  getProjectUsage(orgId: string, projectId: string, context?: HttpContext) {
    const httpContext = this.ensureIgnore403(context);
    return this.http
      .get<QuotaProjectUsage>(`${this.getBaseUrl(orgId)}/project/${projectId}/quota/usage`, { context: httpContext })
      .pipe(defaultOnceHandler());
  }

  /** Replace the quota of a project (`OrganizationProjectQuotaWrite`) */
  setProjectQuota(orgId: string, projectId: string, resources: QuotaResources) {
    return this.http
      .put<ProjectQuota>(`${this.getBaseUrl(orgId)}/project/${projectId}/quota`, resources)
      .pipe(defaultOnceHandler());
  }

  /** Remove the quota of a project and its AZ quotas, refused while the organization has a quota (`OrganizationProjectQuotaWrite`) */
  deleteProjectQuota(orgId: string, projectId: string) {
    return this.http.delete(`${this.getBaseUrl(orgId)}/project/${projectId}/quota`).pipe(defaultOnceHandler());
  }

  /** Replace the quota of a project in one AZ (`ProjectAZQuotaWrite`) */
  setProjectAZQuota(orgId: string, projectId: string, codeAZ: string, resources: QuotaResources) {
    return this.http
      .put<ProjectAZQuota>(`${this.getBaseUrl(orgId)}/project/${projectId}/quota/az/${codeAZ}`, resources)
      .pipe(defaultOnceHandler());
  }

  private ensureIgnore403(context?: HttpContext): HttpContext {
    if (context) {
      if (!context.has(IGNORE_ERROR_STATUSES)) {
        context.set(IGNORE_ERROR_STATUSES, [403]);
      }
      return context;
    }
    return new HttpContext().set(IGNORE_ERROR_STATUSES, [403]);
  }

  private getBaseUrl(orgId: string) {
    return `${HTTP_PROTOCOL}${environment.apiUrl}${API_ENDPOINT}/organization/${orgId}`;
  }
}
