import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { EditQuotaDialog, EditQuotaDialogData } from '@shared/dialogs/edit-quota-dialog.component';
import { Organization, Project } from '@shared/models/data/organization';
import {
  OrganizationQuotaOverview,
  ProjectQuota,
  ProjectQuotaOverview,
  QUOTA_RESOURCES,
  QuotaResourceEnum,
  QuotaResources,
} from '@shared/models/data/quota';
import { EntityTypeEnum } from '@shared/models/permissions/permission';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { QuotaService } from '@shared/services/quota.service';
import { StateService } from '@shared/services/state.service';
import { QUOTA_RESOURCE_LABELS, QuotaBarPart, QuotaFill, quotaFill, quotaValue } from '@shared/utils/quota';
import { QuotaBarComponent, quotaColorClass } from '@shared/components/quota-bar/quota-bar.component';
import { catchError, firstValueFrom, forkJoin, Observable, of } from 'rxjs';

/** Quota data of a project, as loaded from the API */
export interface ProjectQuotaData {
  project: Project;
  /** Stored project quota, undefined when the project has none */
  quota?: ProjectQuota;
  /** null when the project quota could not be loaded */
  overview: ProjectQuotaOverview | null;
  canWriteAZ: boolean;
}

interface ProjectRequestResult {
  overview: ProjectQuotaOverview | null;
  permissions: string[];
}

export interface ResourceBarView {
  resource: QuotaResourceEnum;
  limit: number | null;
  parts: QuotaBarPart[];
}

export type AZQuotaCell = QuotaFill;

export interface AZQuotaRow {
  code: string;
  name: string;
  resources: QuotaResources;
  cells: Record<QuotaResourceEnum, AZQuotaCell>;
}

export interface ProjectQuotaView extends ProjectQuotaData {
  /** Color of the project in the organization bars */
  colorClass: string;
  bars: ResourceBarView[];
  azRows: AZQuotaRow[];
  /** Quota and usage of the whole project, summing up the AZ rows */
  totalCells: Record<QuotaResourceEnum, AZQuotaCell>;
  /** false when the usage of some AZs could not be read */
  usageComplete: boolean;
}

@Component({
  selector: 'spx-organization-quotas',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NgTemplateOutlet,
    QuotaBarComponent,
  ],
  templateUrl: './organization-quotas.component.html',
  styleUrl: './organization-quotas.component.scss',
})
export class OrganizationQuotasComponent {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  private quotaSvc = inject(QuotaService);
  private readonly dialog = inject(MatDialog);

  readonly resources = QUOTA_RESOURCES;
  readonly labels = QUOTA_RESOURCE_LABELS;

  loading = signal(false);
  hasLoaded = signal(false);
  orgOverview = signal<OrganizationQuotaOverview | undefined>(undefined);
  projectsData = signal<ProjectQuotaData[]>([]);
  /** Projects currently maximized */
  expandedProjects = signal<Set<string>>(new Set());

  isExpanded(projectId: string): boolean {
    return this.expandedProjects().has(projectId);
  }

  toggleProject(projectId: string): void {
    const next = new Set(this.expandedProjects());
    if (next.has(projectId)) {
      next.delete(projectId);
    } else {
      next.add(projectId);
    }
    this.expandedProjects.set(next);
  }

  canWriteProjectQuota = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.OrganizationProjectQuotaWrite)
  );

  /** Organization quota, split among the projects (allocation only, the usage is in the AZ tables) */
  orgBars = computed<ResourceBarView[]>(() => {
    const overview = this.orgOverview();
    if (!overview) {
      return [];
    }
    return this.resources.map(resource => ({
      resource,
      limit: this.orgLimit(resource),
      parts: this.projectsData().map(data => ({
        key: data.project.id,
        label: data.project.name,
        value: this.projectAllocation(data, resource),
      })),
    }));
  });

  /** Project quotas, split among the AZs (allocation only, the usage is in the AZ tables) */
  projectViews = computed<ProjectQuotaView[]>(() => {
    const azList = this.stateSvc.azList();
    return this.projectsData().map((data, index) => {
      const azQuotas = data.overview?.azQuotas ?? [];
      const codes = new Set(azList.map(az => az.code));
      azQuotas.forEach(azq => codes.add(azq.codeAZ));
      const azs = [...codes].map(code => {
        const azq = azQuotas.find(q => q.codeAZ === code);
        return {
          code,
          name: azList.find(az => az.code === code)?.name ?? code,
          azq,
        };
      });

      const bars = this.resources.map(resource => ({
        resource,
        limit: this.projectLimit(data, resource),
        parts: azs.map(az => ({ key: az.code, label: az.name, value: this.azValue(data, az.code, resource) })),
      }));

      const totalCells = Object.fromEntries(
        this.resources.map(resource => {
          const value = this.projectAllocation(data, resource);
          const azValues = azs.map(az => this.azValue(data, az.code, resource));
          const used = this.projectTotalUsed(azs, resource, value, azValues);
          return [resource, quotaFill(resource, used, value)];
        })
      ) as Record<QuotaResourceEnum, AZQuotaCell>;

      const azRows = azs.map(az => ({
        code: az.code,
        name: az.name,
        resources: this.azResources(data, az.code),
        cells: Object.fromEntries(
          this.resources.map(resource => {
            const value = this.azValue(data, az.code, resource);
            const used = this.childUsage(az.azq, resource, value);
            return [resource, quotaFill(resource, used, value)];
          })
        ) as Record<QuotaResourceEnum, AZQuotaCell>,
      }));

      return {
        ...data,
        colorClass: quotaColorClass('org-quotas__color', index),
        bars,
        azRows,
        totalCells,
        usageComplete: azQuotas.every(azq => azq.available),
      };
    });
  });

  constructor() {
    effect(() => {
      const org = this.stateSvc.organization();
      if (org) {
        untracked(() => this.load(org));
      }
    });
  }

  async load(org: Organization) {
    this.loading.set(true);
    const projects = org.projects ?? [];
    const canReadOrg = this.permissionSvc.permissions().includes(PermissionsEnum.OrganizationProjectQuotaRead);

    // A project that cannot be loaded is still displayed, without its AZ quotas
    const projectRequests: Observable<ProjectRequestResult[]> =
      projects.length === 0
        ? of([])
        : forkJoin(
            projects.map(project =>
              forkJoin({
                overview: this.quotaSvc.getProjectQuota(org.id, project.id).pipe(catchError(() => of(null))),
                permissions: this.permissionSvc
                  .getEntityPermissions(org.id, EntityTypeEnum.Project, project.id)
                  .pipe(catchError(() => of([]))),
              })
            )
          );

    const orgQuotaRequest = canReadOrg
      ? this.quotaSvc.getOrganizationQuota(org.id).pipe(catchError(() => of(undefined)))
      : of(undefined);

    try {
      const [overview, results] = await Promise.all([firstValueFrom(orgQuotaRequest), firstValueFrom(projectRequests)]);
      this.orgOverview.set(overview);
      const validProjectsData: ProjectQuotaData[] = [];
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        const projectOverview = results[i]?.overview ?? null;
        if (!projectOverview) {
          continue;
        }
        let quota: ProjectQuota | undefined;
        if (overview !== undefined) {
          quota = overview.projectQuotas?.find(pq => pq.projectId === project.id);
        } else if (projectOverview.limit) {
          quota = { projectId: project.id, organizationId: org.id, limit: projectOverview.limit };
        }
        validProjectsData.push({
          project,
          quota,
          overview: projectOverview,
          canWriteAZ: (results[i]?.permissions ?? []).includes(PermissionsEnum.ProjectAZQuotaWrite),
        });
      }
      this.projectsData.set(validProjectsData);
      this.hasLoaded.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  editProjectQuota(view: ProjectQuotaView) {
    const available = Object.fromEntries(
      this.resources.map(resource => {
        const limit = this.orgLimit(resource);
        if (limit === null) {
          return [resource, null];
        }
        const remaining = quotaValue(this.orgOverview()?.remaining, resource);
        const currentAllocation = this.projectAllocation(view, resource) ?? 0;
        if (remaining !== null) {
          return [resource, Math.max(remaining + currentAllocation, 0)];
        }
        const others = this.projectsData()
          .filter(data => data.project.id !== view.project.id)
          .reduce((acc, data) => acc + (this.projectAllocation(data, resource) ?? 0), 0);
        return [resource, Math.max(limit - others, 0)];
      })
    );

    const data: EditQuotaDialogData = {
      title: `Quota of the project '${view.project.name}'`,
      description: 'Share of the organization quota allocated to this project.',
      parentType: 'organization',
      resources: view.quota?.limit ?? {},
      available,
      emptyHint:
        'Leave a field empty to not limit the resource. When the organization limits it, the project gets none of it.',
    };
    this.dialog
      .open(EditQuotaDialog, { data })
      .afterClosed()
      .subscribe(async (res?: QuotaResources) => {
        if (res) {
          await firstValueFrom(this.quotaSvc.setProjectQuota(this.orgId(), view.project.id, res));
          this.reload();
        }
      });
  }

  editAZQuota(view: ProjectQuotaView, row: AZQuotaRow) {
    const available = Object.fromEntries(
      this.resources.map(resource => {
        const limit = this.projectLimit(view, resource);
        if (limit === null) {
          return [resource, null];
        }
        const remaining = quotaValue(view.overview?.remaining, resource);
        const currentAllocation = this.azValue(view, row.code, resource) ?? 0;
        if (remaining !== null) {
          return [resource, Math.max(remaining + currentAllocation, 0)];
        }
        const others = view.azRows
          .filter(r => r.code !== row.code)
          .reduce((acc, r) => acc + (this.azValue(view, r.code, resource) ?? 0), 0);
        return [resource, Math.max(limit - others, 0)];
      })
    );

    const data: EditQuotaDialogData = {
      title: `Quota of '${view.project.name}' in ${row.name}`,
      description: 'Share of the project quota allocated to this availability zone.',
      parentType: 'project',
      resources: row.resources,
      available,
      emptyHint:
        'Leave a field empty to not limit the resource. When the project or the organization limits it, nothing of it is allowed in this availability zone.',
    };
    this.dialog
      .open(EditQuotaDialog, { data })
      .afterClosed()
      .subscribe(async (res?: QuotaResources) => {
        if (res) {
          await firstValueFrom(this.quotaSvc.setProjectAZQuota(this.orgId(), view.project.id, row.code, res));
          this.reload();
        }
      });
  }

  /** A project quota can only be removed while the organization has no quota */
  canRemoveProjectQuota(view: ProjectQuotaView) {
    return !!view.quota && !!this.orgOverview()?.unlimited;
  }

  removeProjectQuota(view: ProjectQuotaView) {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Remove quota',
        content: `Are you sure you want to remove the quota of the project '${view.project.name}' and its availability zone quotas?`,
      },
    });
    ref.afterClosed().subscribe(async res => {
      if (res === true) {
        await firstValueFrom(this.quotaSvc.deleteProjectQuota(this.orgId(), view.project.id));
        this.reload();
      }
    });
  }

  reload() {
    const org = this.stateSvc.organization();
    if (org) {
      this.load(org);
    }
  }

  /** Organization limit of a resource, null when not limited */
  orgLimit(resource: QuotaResourceEnum): number | null {
    const overview = this.orgOverview();
    if (!overview || overview.unlimited) {
      return null;
    }
    return quotaValue(overview.limit, resource);
  }

  /**
   * What a project takes from the organization quota: its project quota or effective limit when it has
   * one, otherwise the sum of its AZ quotas. null when the project is not limited on this resource.
   */
  projectAllocation(data: ProjectQuotaData, resource: QuotaResourceEnum): number | null {
    const limit = this.projectLimit(data, resource);
    if (limit !== null) {
      return limit;
    }
    return quotaValue(data.overview?.allocated, resource);
  }

  /**
   * Limit the AZ quotas of a project must fit in: the project's effective limit, null when not limited.
   */
  projectLimit(data: ProjectQuotaData, resource: QuotaResourceEnum): number | null {
    return quotaValue(data.overview?.limit ?? data.quota?.limit, resource);
  }

  /** Quota of a project in an AZ */
  azValue(data: ProjectQuotaData, codeAZ: string, resource: QuotaResourceEnum): number | null {
    return quotaValue(this.azResources(data, codeAZ), resource);
  }

  /**
   * What a child uses of `resource`: undefined while loading or when not displayed, null when unavailable.
   * Kubernetes only tracks the limited resources: a missing usage is 0 for a limited child, and not
   * displayed for an unlimited one.
   */
  private childUsage(
    azq: { available: boolean; used: QuotaResources } | undefined,
    resource: QuotaResourceEnum,
    value: number | null
  ): number | null | undefined {
    if (!azq) {
      return value !== null ? 0 : undefined;
    }
    if (!azq.available) {
      return null;
    }
    return quotaValue(azq.used, resource) ?? (value !== null ? 0 : undefined);
  }

  /** Total usage of a project, only displayed once loaded and when it or one of its children (`values`) is limited */
  private projectTotalUsed(
    azs: { azq?: { available: boolean; used: QuotaResources } }[],
    resource: QuotaResourceEnum,
    limit: number | null,
    values: (number | null)[]
  ): number | null | undefined {
    const tracked = limit !== null || values.some(v => v !== null);
    let totalUsed = 0;
    let hasAnyUsage = false;
    for (const az of azs) {
      if (az.azq?.available) {
        const val = quotaValue(az.azq.used, resource);
        if (val !== null) {
          totalUsed += val;
          hasAnyUsage = true;
        }
      }
    }
    if (hasAnyUsage || tracked) {
      return totalUsed;
    }
    return undefined;
  }

  private azResources(data: ProjectQuotaData, codeAZ: string): QuotaResources {
    return data.overview?.azQuotas?.find(azq => azq.codeAZ === codeAZ)?.limit ?? {};
  }

  private orgId() {
    return this.stateSvc.organization()!.id;
  }
}
