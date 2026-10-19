import { NgTemplateOutlet } from '@angular/common';
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
  QuotaAZUsage,
  QuotaOrganizationUsage,
  QuotaProjectUsage,
  QuotaResourceEnum,
  QuotaResources,
} from '@shared/models/data/quota';
import { EntityTypeEnum } from '@shared/models/permissions/permission';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { QuotaService } from '@shared/services/quota.service';
import { StateService } from '@shared/services/state.service';
import {
  enforcedQuotaValue,
  formatQuotaQuantity,
  QUOTA_RESOURCE_LABELS,
  QuotaBarPart,
  quotaValue,
} from '@shared/utils/quota';
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

/** Usage of a resource in an AZ, for the AZ table */
export interface AZUsageCell {
  text: string;
  /** Filled part of the meter, null without quota to compare with */
  percent: number | null;
  over: boolean;
}

export interface AZQuotaCell {
  /** Quota of the AZ */
  value: string;
  /** undefined when the usage is not displayed */
  usage?: AZUsageCell;
}

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
  orgOverview = signal<OrganizationQuotaOverview | undefined>(undefined);
  projectsData = signal<ProjectQuotaData[]>([]);
  /** Projects currently maximized */
  expandedProjects = signal<Set<string>>(new Set());
  /** Current usage: undefined while loading, null when it could not be loaded */
  usage = signal<QuotaOrganizationUsage | null | undefined>(undefined);

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
      const projectUsage = this.projectUsage(data.project.id);
      const codes = new Set(azList.map(az => az.code));
      data.overview?.azQuotas?.forEach(azq => codes.add(azq.CodeAZ));
      const azs = [...codes].map(code => ({
        code,
        name: azList.find(az => az.code === code)?.name ?? code,
        usage: this.azUsage(projectUsage, code),
      }));

      const bars = this.resources.map(resource => ({
        resource,
        limit: this.projectLimit(data, resource),
        parts: azs.map(az => ({ key: az.code, label: az.name, value: this.azValue(data, az.code, resource) })),
      }));

      const totalCells = Object.fromEntries(
        this.resources.map(resource => {
          const value = this.projectAllocation(data, resource);
          const azValues = azs.map(az => this.azValue(data, az.code, resource));
          const cell: AZQuotaCell = {
            value: value === null ? 'Unlimited' : `${formatQuotaQuantity(resource, value)} allocated`,
            usage: this.usageCell(resource, value, this.parentUsage(projectUsage, resource, value, azValues)),
          };
          return [resource, cell];
        })
      ) as Record<QuotaResourceEnum, AZQuotaCell>;

      const azRows = azs.map(az => ({
        code: az.code,
        name: az.name,
        resources: this.azResources(data, az.code),
        cells: Object.fromEntries(
          this.resources.map(resource => {
            const value = this.azValue(data, az.code, resource);
            const cell: AZQuotaCell = {
              value: value === null ? 'Unlimited' : `${formatQuotaQuantity(resource, value)} allocated`,
              usage: this.usageCell(resource, value, this.childUsage(az.usage, resource, value)),
            };
            return [resource, cell];
          })
        ) as Record<QuotaResourceEnum, AZQuotaCell>,
      }));

      return {
        ...data,
        colorClass: quotaColorClass('org-quotas__color', index),
        bars,
        azRows,
        totalCells,
        usageComplete: projectUsage?.complete ?? true,
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
    // The usage is read from every AZ: it may come later than the quotas, which are shown meanwhile
    this.loadUsage(org);
    const projects = org.projects ?? [];
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

    try {
      const [overview, results] = await Promise.all([
        firstValueFrom(this.quotaSvc.getOrganizationQuota(org.id)),
        firstValueFrom(projectRequests),
      ]);
      this.orgOverview.set(overview);
      this.projectsData.set(
        projects.map((project, i) => ({
          project,
          quota: overview.projectQuotas?.find(pq => pq.ProjectId === project.id),
          overview: results[i]?.overview ?? null,
          canWriteAZ: (results[i]?.permissions ?? []).includes(PermissionsEnum.ProjectAZQuotaWrite),
        }))
      );
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
      resources: view.quota?.Resources ?? {},
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

  async loadUsage(org: Organization) {
    this.usage.set(undefined);
    let usage: QuotaOrganizationUsage | null;
    try {
      usage = await firstValueFrom(this.quotaSvc.getOrganizationUsage(org.id));
    } catch {
      usage = null;
    }
    // Ignore the answer of an organization that is no longer displayed
    if (this.stateSvc.organization()?.id === org.id) {
      this.usage.set(usage);
    }
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
    return quotaValue(overview.resources, resource);
  }

  /**
   * What a project takes from the organization quota (same as the API): its project quota when it has
   * one, otherwise the sum of its AZ quotas. null when the project is not limited on this resource.
   */
  projectAllocation(data: ProjectQuotaData, resource: QuotaResourceEnum): number | null {
    if (data.quota) {
      return this.projectLimit(data, resource);
    }
    const values = (data.overview?.azQuotas ?? [])
      .map(azq => quotaValue(azq.Resources, resource))
      .filter((v): v is number => v !== null);
    if (values.length > 0) {
      return values.reduce((acc, v) => acc + v, 0);
    }
    return this.orgLimit(resource) !== null ? 0 : null;
  }

  /**
   * Limit the AZ quotas of a project must fit in (same as the API): the project quota, or 0 when the
   * organization limits a resource the project quota does not. null when not limited.
   */
  projectLimit(data: ProjectQuotaData, resource: QuotaResourceEnum): number | null {
    return enforcedQuotaValue(data.quota?.Resources ?? data.overview?.resources, resource, this.orgLimit(resource));
  }

  /** Enforced quota of a project in an AZ: an AZ without allocation for a resource limited by a parent gets 0 */
  azValue(data: ProjectQuotaData, codeAZ: string, resource: QuotaResourceEnum): number | null {
    return enforcedQuotaValue(this.azResources(data, codeAZ), resource, this.projectLimit(data, resource));
  }

  /** Usage of a project: undefined while loading, null when unavailable */
  private projectUsage(projectId: string): QuotaProjectUsage | null | undefined {
    const usage = this.usage();
    if (!usage) {
      return usage;
    }
    return usage.projects?.find(p => p.projectId === projectId) ?? null;
  }

  /** Usage of a project in an AZ: undefined while loading, null when unavailable */
  private azUsage(usage: QuotaProjectUsage | null | undefined, codeAZ: string): QuotaAZUsage | null | undefined {
    if (!usage) {
      return usage;
    }
    const azUsage = usage.azs?.find(az => az.codeAZ === codeAZ);
    return azUsage?.available ? azUsage : null;
  }

  /**
   * What a child uses of `resource`: undefined while loading or when not displayed, null when unavailable.
   * Kubernetes only tracks the limited resources: a missing usage is 0 for a limited child, and not
   * displayed for an unlimited one.
   */
  private childUsage(
    usage: { used: QuotaResources } | null | undefined,
    resource: QuotaResourceEnum,
    value: number | null
  ): number | null | undefined {
    if (!usage) {
      return usage;
    }
    return quotaValue(usage.used, resource) ?? (value !== null ? 0 : undefined);
  }

  /** Total usage of a parent, only displayed once loaded and when it or one of its children (`values`) is limited */
  private parentUsage(
    usage: { used: QuotaResources } | null | undefined,
    resource: QuotaResourceEnum,
    limit: number | null,
    values: (number | null)[]
  ): number | null | undefined {
    if (usage === undefined) {
      return undefined;
    }
    const tracked = limit !== null || values.some(v => v !== null);
    const used = usage ? quotaValue(usage.used, resource) : null;
    if (used !== null) {
      return used;
    }
    if (!tracked) {
      return undefined;
    }
    return usage ? 0 : null;
  }

  private usageCell(
    resource: QuotaResourceEnum,
    value: number | null,
    used: number | null | undefined
  ): AZUsageCell | undefined {
    if (used === undefined) {
      return undefined;
    }
    if (used === null) {
      return { text: 'Usage unavailable', percent: null, over: false };
    }
    const text = `${formatQuotaQuantity(resource, used)} used`;
    if (value === null) {
      return { text, percent: null, over: false };
    }
    if (value === 0) {
      return { text, percent: 100, over: true };
    }
    const percent = Math.min((used / value) * 100, 100);
    return { text, percent, over: used >= value };
  }

  private azResources(data: ProjectQuotaData, codeAZ: string): QuotaResources {
    return data.overview?.azQuotas?.find(azq => azq.CodeAZ === codeAZ)?.Resources ?? {};
  }

  private orgId() {
    return this.stateSvc.organization()!.id;
  }
}
