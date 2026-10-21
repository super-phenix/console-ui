import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { ScreenService } from '@shared/services/screen.service';
import { StateService } from '@shared/services/state.service';
import { ChangelogComponent } from '../changelog/changelog.component';
import { Announcement, environment } from '@env/environment';
import { BannerLevelEnum } from '@shared/models/enums';
import { AZService } from '@products/00_shared/services/az.service';
import {
  getProduct,
  getProductTitle,
  ProductCompute,
  ProductNetwork,
  ProductPaas,
  ProductStorage,
} from '@shared/models/data/product.enum';
import { QUOTA_RESOURCES, QuotaAZUsage, QuotaResourceEnum } from '@shared/models/data/quota';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { QuotaService } from '@shared/services/quota.service';
import {
  enforcedQuotaValue,
  QUOTA_RESOURCE_ICONS,
  QUOTA_RESOURCE_LABELS,
  QUOTA_SETTINGS_FRAGMENT,
  QUOTA_SETTINGS_LINK,
  QuotaFill,
  quotaFill,
  quotaValue,
} from '@shared/utils/quota';
import { catchError, forkJoin, of } from 'rxjs';
import { DashboardService, RecentProduct } from '../dashboard.service';

/**
 * A dashboard card: one product category, and the product types its count sums up.
 * The product types are the ones returned by the API summary endpoint.
 */
interface CategoryCard {
  title: string;
  icon: string;
  link: string[];
  /** Create page of the category's main product, offered as a shortcut on the card. */
  createLink: string[];
  productTypes: string[];
}

const CATEGORY_CARDS: CategoryCard[] = [
  {
    title: ProductCompute.title,
    icon: ProductCompute.icon,
    link: ['/products', ProductCompute.baseLink, ProductCompute.items[0].link],
    createLink: ['/products', ProductCompute.baseLink, 'instance', 'create'],
    productTypes: ['instance', 'vmSnapshot'],
  },
  {
    title: ProductStorage.title,
    icon: ProductStorage.icon,
    link: ['/products', ProductStorage.baseLink, ProductStorage.items[0].link],
    createLink: ['/products', ProductStorage.baseLink, 'disk', 'create'],
    productTypes: ['disk', 'snapshot', 'baas', 'bucket'],
  },
  {
    title: ProductNetwork.title,
    icon: ProductNetwork.icon,
    link: ['/products', ProductNetwork.baseLink, ProductNetwork.items[0].link],
    createLink: ['/products', ProductNetwork.baseLink, 'vpc', 'create'],
    productTypes: ['vpc', 'subnet', 'eip', 'loadBalancer', 'securityGroup'],
  },
  {
    title: ProductPaas.title,
    icon: ProductPaas.icon,
    link: ['/products', ProductPaas.baseLink, ProductPaas.items[0].link],
    createLink: ['/products', ProductPaas.baseLink, 'kaas', 'create'],
    productTypes: ['kaas'],
  },
];

/**
 * Product types with no details page: their rows link to the product list instead.
 * Keep in sync with the routes of `03_products`.
 */
const TYPES_WITHOUT_DETAILS = ['ssh'];

/** Above this share of the quota, the meter is highlighted so the limit becomes noticeable. */
const QUOTA_WARN_PERCENT = 80;

interface QuotaFills {
  /** The whole project, per resource */
  project: Record<QuotaResourceEnum, QuotaFill>;
  /** Each AZ the project has something allocated or used in */
  azs: { code: string; name: string; cells: Record<QuotaResourceEnum, QuotaFill> }[];
  /** Nothing limits the project: Kubernetes does not track its usage */
  unlimited: boolean;
}

@Component({
  selector: 'spx-dashboard',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    NgTemplateOutlet,
    RouterLink,
    BannerComponent,
    ContentHeaderComponent,
    ChangelogComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  protected stateSvc = inject(StateService);
  protected screenSvc = inject(ScreenService);
  private dashboardSvc = inject(DashboardService);
  private permissionSvc = inject(PermissionService);
  private quotaSvc = inject(QuotaService);

  protected announcement: Announcement | undefined = environment.announcement;

  protected announcementText = computed(() => this.announcement?.longText ?? this.announcement?.text ?? '');

  /** Severity of the configured announcement, as a banner level. */
  protected announcementLevel = computed(() => {
    switch (this.announcement?.severity) {
      case 'warn':
        return BannerLevelEnum.Warn;
      case 'error':
        return BannerLevelEnum.Error;
      default:
        return BannerLevelEnum.Info;
    }
  });

  /**
   * Resource overview of the current project, in a single request.
   * Re-fetched only when the organization or the project changes.
   */
  protected summary = rxResource({
    params: computed(() => [this.stateSvc.organization(), this.stateSvc.project()]),
    stream: () => {
      const org = this.stateSvc.organization();
      const project = this.stateSvc.project();
      if (!org || !project) {
        return of(undefined);
      }

      return this.dashboardSvc.getSummary(org.id, project.id).pipe(
        catchError(err => {
          console.error(err);
          return of(undefined);
        })
      );
    },
  });

  /**
   * The cards to display. A category is dropped when the API returned none of its product types,
   * which means the user is not allowed to read any of them.
   */
  protected cards = computed(() => {
    const counts = this.summary.value()?.counts;
    if (!counts) {
      return CATEGORY_CARDS.map(card => ({ ...card, value: undefined }));
    }

    return CATEGORY_CARDS.filter(card => card.productTypes.some(type => type in counts)).map(card => ({
      ...card,
      value: card.productTypes.reduce((total, type) => total + (counts[type] ?? 0), 0),
    }));
  });

  /** Product creation quota of the project, with the percentage to fill the bar with. */
  protected quota = computed(() => {
    const quota = this.summary.value()?.quota;
    if (!quota || quota.limit <= 0) {
      return undefined;
    }

    const percent = Math.min(100, Math.round((quota.used / quota.limit) * 100));
    return { ...quota, percent, nearLimit: percent >= QUOTA_WARN_PERCENT };
  });

  /** The project quota can be read; the organization one is only needed to apply its limits to the project. */
  protected canReadQuota = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectAZQuotaRead)
  );
  /** Also needed to open the Quotas tab of the organization settings */
  protected canReadOrgQuota = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.OrganizationProjectQuotaRead)
  );
  protected canOpenQuotaSettings = computed(() => this.canReadQuota() || this.canReadOrgQuota());
  protected readonly quotaSettingsLink = QUOTA_SETTINGS_LINK;
  protected readonly quotaSettingsFragment = QUOTA_SETTINGS_FRAGMENT;
  protected readonly quotaResources = QUOTA_RESOURCES;
  protected readonly quotaLabels = QUOTA_RESOURCE_LABELS;
  protected readonly quotaIcons = QUOTA_RESOURCE_ICONS;

  /** Quota and usage of the current project, and quota of its organization (when readable). */
  protected quotas = rxResource({
    params: computed(() => [
      this.stateSvc.organization(),
      this.stateSvc.project(),
      this.canReadQuota(),
      this.canReadOrgQuota(),
    ]),
    stream: () => {
      const org = this.stateSvc.organization();
      const project = this.stateSvc.project();
      if (!org || !project || !this.canReadQuota()) {
        return of(undefined);
      }

      return forkJoin({
        project: this.quotaSvc.getProjectQuota(org.id, project.id),
        // Told apart from the quotas, which are needed to know what the usage is compared with
        usage: this.quotaSvc.getProjectUsage(org.id, project.id).pipe(catchError(() => of(null))),
        organization: this.canReadOrgQuota()
          ? this.quotaSvc.getOrganizationQuota(org.id).pipe(catchError(() => of(undefined)))
          : of(undefined),
      }).pipe(
        catchError(err => {
          console.error(err);
          return of(undefined);
        })
      );
    },
  });

  /**
   * How full the project and each of its AZs are: what is used of what is allocated, per resource. The
   * allocation is the one the API enforces: the project quota (0 when the organization limits a resource
   * the project does not, or the sum of the AZ quotas when only the AZs are limited), and the AZ quotas
   * (0 when the project limits a resource the AZ does not).
   */
  protected quotaFills = computed<QuotaFills | undefined>(() => {
    const quotas = this.quotas.value();
    if (!quotas?.usage) {
      return undefined;
    }

    const azList = this.stateSvc.azList();
    const usage = quotas.usage;
    const codes = new Set(azList.map(az => az.code));
    quotas.project.azQuotas?.forEach(azq => codes.add(azq.CodeAZ));
    usage.azs?.forEach(az => codes.add(az.codeAZ));
    const azs = [...codes].map(code => ({
      code,
      name: azList.find(az => az.code === code)?.name ?? code,
      resources: quotas.project.azQuotas?.find(azq => azq.CodeAZ === code)?.Resources,
      usage: usage.azs?.find(az => az.codeAZ === code),
    }));

    const org = quotas.organization;
    const limits = QUOTA_RESOURCES.map(resource => {
      const orgLimit = org && !org.unlimited ? quotaValue(org.resources, resource) : null;
      const projectLimit = enforcedQuotaValue(quotas.project.resources, resource, orgLimit);
      const azLimits = azs.map(az => enforcedQuotaValue(az.resources, resource, projectLimit));
      const limit = projectLimit ?? (azLimits.every(v => v !== null) ? azLimits.reduce((acc, v) => acc + v!, 0) : null);
      return { resource, limit, azLimits, tracked: projectLimit !== null || azLimits.some(v => v !== null) };
    });
    if (limits.every(l => !l.tracked)) {
      return { project: {} as Record<QuotaResourceEnum, QuotaFill>, azs: [], unlimited: true };
    }

    const project = Object.fromEntries(
      limits.map(({ resource, limit, tracked }) => [
        resource,
        quotaFill(resource, quotaValue(usage.used, resource) ?? (tracked ? 0 : undefined), limit),
      ])
    ) as Record<QuotaResourceEnum, QuotaFill>;

    const rows = azs
      .map((az, i) => {
        const cells = Object.fromEntries(
          limits.map(({ resource, azLimits }) => [
            resource,
            quotaFill(resource, this.azUsedValue(az.usage, usage.complete, resource, azLimits[i]), azLimits[i]),
          ])
        ) as Record<QuotaResourceEnum, QuotaFill>;
        return { code: az.code, name: az.name, cells };
      })
      // Nothing allocated nor used in the AZ: nothing to tell about it
      .filter(row => Object.values(row.cells).some(cell => cell.percent !== null || cell.unavailable));

    return { project, azs: rows, unlimited: false };
  });

  /** Last created resources, with their label, their AZ logo and the page to open. */
  protected recent = computed(() => {
    const azList = this.stateSvc.azList();
    return (this.summary.value()?.recent ?? []).map(product => ({
      ...product,
      typeTitle: getProductTitle(product.productType),
      logoUrl: AZService.getLogoUrl(product.codeAz, azList),
      link: this.recentLink(product),
    }));
  });

  /**
   * The AZs the project actually holds resources in, busiest first. An AZ the project has nothing
   * in is not listed at all: the API only reports the ones in use.
   */
  protected zones = computed(() => {
    const countsByAz = this.summary.value()?.countsByAz ?? {};
    const azList = this.stateSvc.azList();

    return Object.entries(countsByAz)
      .map(([code, count]) => ({
        code,
        // An AZ missing from the list is still worth showing, under its code.
        name: azList.find(az => az.code === code)?.name ?? code,
        logoUrl: AZService.getLogoUrl(code, azList),
        count,
      }))
      .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
  });

  /**
   * What the project uses of `resource` in an AZ, see quotaFill. Kubernetes only tracks the limited
   * resources: a missing usage is 0 when the AZ is limited, and not tracked otherwise. An AZ missing from a
   * complete usage holds nothing.
   */
  private azUsedValue(
    usage: QuotaAZUsage | undefined,
    complete: boolean,
    resource: QuotaResourceEnum,
    azLimit: number | null
  ): number | null | undefined {
    if (usage ? !usage.available : !complete) {
      return null;
    }
    return (usage && quotaValue(usage.used, resource)) ?? (azLimit !== null ? 0 : undefined);
  }

  /** Deep link to a recent resource: its details page, or the product list when it has none. */
  private recentLink(product: RecentProduct) {
    const path = getProduct(product.productType);
    if (!path) {
      return undefined;
    }
    if (TYPES_WITHOUT_DETAILS.includes(product.productType)) {
      return ['/products', ...path.split('/')];
    }
    return ['/products', ...path.split('/'), 'details', product.codeAz, product.eid];
  }
}
