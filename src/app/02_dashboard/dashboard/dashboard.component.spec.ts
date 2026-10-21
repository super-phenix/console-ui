import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_ENDPOINT, CONTROLLER_PATH, HTTP_PROTOCOL, environment } from '@env/environment';
import { OrganizationQuotaOverview, ProjectQuotaOverview, QuotaProjectUsage } from '@shared/models/data/quota';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { ScreenService } from '@shared/services/screen.service';
import { StateService } from '@shared/services/state.service';

import { ProjectSummary } from '../dashboard.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  const orgId = 'org1';
  const projectId = 'proj1';
  const summaryUrl = `${HTTP_PROTOCOL}${environment.apiUrl}/${orgId}${CONTROLLER_PATH}/${projectId}/summary`;

  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  const organization = signal<{ id: string } | undefined>(undefined);
  const project = signal<{ id: string } | undefined>(undefined);
  const azList = signal<{ code: string; name: string; logoUrl?: string }[]>([]);

  const stateSvcStub = { organization, project, azList };

  const isMobile = signal(false);
  const isWeb = signal(true);
  const screenSvcStub = { isMobile, isWeb, isTablet: signal(false) };

  /** A summary payload with everything empty, to be overridden per test. */
  function emptySummary(): ProjectSummary {
    return { counts: {}, countsByAz: {}, quota: { used: 0, limit: 0 }, recent: [] };
  }

  /**
   * Build the component, then flush the summary request with `summary` if one was made.
   * The request must be answered before the fixture is awaited, otherwise it is cancelled.
   */
  async function createComponent(summary?: ProjectSummary) {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    if (summary) {
      httpMock.expectOne(summaryUrl).flush(summary);
    }

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /** Inventory segment values as rendered, keyed by category name. */
  function renderedCards(): Record<string, string> {
    const cards: Record<string, string> = {};
    for (const segment of fixture.nativeElement.querySelectorAll('.dashboard__segment')) {
      const name = segment.querySelector('.dashboard__segment-name').textContent.trim();
      cards[name] = segment.querySelector('.dashboard__segment-value').textContent.trim();
    }
    return cards;
  }

  /** Text of a row, whitespace collapsed. */
  function rowText(row: Element): string {
    return row.textContent!.replace(/\s+/g, ' ').trim();
  }

  beforeEach(async () => {
    environment.announcement = undefined;
    organization.set(undefined);
    project.set(undefined);
    azList.set([]);
    isMobile.set(false);
    isWeb.set(true);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: StateService, useValue: stateSvcStub },
        { provide: ScreenService, useValue: screenSvcStub },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(PermissionService).permissions.set([]);
  });

  afterEach(() => {
    environment.announcement = undefined;
    httpMock.verify();
  });

  it('should create', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  describe('resource counts', () => {
    it('should not call the API when no project is selected', async () => {
      await createComponent();

      httpMock.expectNone(summaryUrl);
    });

    it('should fetch the summary once when an organization and a project are selected', async () => {
      organization.set({ id: orgId });
      project.set({ id: projectId });

      // createComponent asserts a single request and answers it; nothing must follow it.
      await createComponent({ ...emptySummary(), counts: { instance: 3, disk: 5, vpc: 2, kaas: 1 } });

      httpMock.expectNone(summaryUrl);
    });

    it('should sum the product types of each category', async () => {
      organization.set({ id: orgId });
      project.set({ id: projectId });

      await createComponent({
        ...emptySummary(),
        counts: {
          instance: 3,
          vmSnapshot: 1,
          disk: 5,
          snapshot: 2,
          baas: 0,
          bucket: 1,
          vpc: 2,
          subnet: 4,
          eip: 0,
          loadBalancer: 1,
          securityGroup: 3,
          kaas: 1,
        },
      });

      expect(renderedCards()).toEqual({
        Compute: '4',
        Storage: '8',
        Network: '10',
        PaaS: '1',
      });
    });

    it('should hide a category the user is not allowed to read', async () => {
      organization.set({ id: orgId });
      project.set({ id: projectId });

      await createComponent({ ...emptySummary(), counts: { instance: 3, disk: 5, vpc: 2 } });

      const cards = renderedCards();
      expect(cards['PaaS']).toBeUndefined();
      expect(cards['Compute']).toBe('3');
    });

    it('should show a dash instead of a count when the request fails', async () => {
      organization.set({ id: orgId });
      project.set({ id: projectId });

      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      httpMock.expectOne(summaryUrl).error(new ProgressEvent('error'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(Object.values(renderedCards())).toEqual(['—', '—', '—', '—']);
    });
  });

  describe('resource quota', () => {
    it('should show the quota usage and fill the meter', async () => {
      organization.set({ id: orgId });
      project.set({ id: projectId });

      await createComponent({ ...emptySummary(), quota: { used: 42, limit: 200 } });

      const value = fixture.nativeElement.querySelector('.dashboard__quota-value');
      const bar = fixture.nativeElement.querySelector('.dashboard__quota-bar');
      expect(value.textContent.replace(/\s+/g, ' ').trim()).toBe('42 of 200 resources');
      expect(bar.getAttribute('aria-valuenow')).toBe('21');
      expect(fixture.nativeElement.querySelector('.dashboard__quota--near-limit')).toBeNull();
    });

    it('should highlight the meter once close to the limit', async () => {
      organization.set({ id: orgId });
      project.set({ id: projectId });

      await createComponent({ ...emptySummary(), quota: { used: 171, limit: 200 } });

      expect(fixture.nativeElement.querySelector('.dashboard__quota--near-limit')).toBeTruthy();
    });

    it('should hide the quota when no limit is set', async () => {
      organization.set({ id: orgId });
      project.set({ id: projectId });

      await createComponent({ ...emptySummary(), quota: { used: 0, limit: 0 } });

      expect(fixture.nativeElement.querySelector('.dashboard__quota')).toBeNull();
    });
  });

  describe('project quotas', () => {
    const quotaBaseUrl = `${HTTP_PROTOCOL}${environment.apiUrl}${API_ENDPOINT}/organization/${orgId}`;

    function projectOverview(): ProjectQuotaOverview {
      return {
        projectId,
        organizationId: orgId,
        resources: { cpu: '8', memory: '32Gi' },
        azQuotas: [
          { ID: 'q1', ProjectId: projectId, CodeAZ: 'az1', Resources: { cpu: '6', memory: '16Gi' } },
          { ID: 'q2', ProjectId: projectId, CodeAZ: 'az2', Resources: { cpu: '2' } },
        ],
      };
    }

    function projectUsage(): QuotaProjectUsage {
      return {
        projectId,
        complete: true,
        used: { cpu: '3500m', memory: '4Gi' },
        azs: [
          { codeAZ: 'az1', available: true, used: { cpu: '3', memory: '4Gi' } },
          { codeAZ: 'az2', available: true, used: { cpu: '500m' } },
        ],
      };
    }

    /** Build the component and answer the summary, the usage and the quota requests. */
    async function createWithQuotas(
      projectQuota: ProjectQuotaOverview | 'error',
      org?: OrganizationQuotaOverview,
      usage: QuotaProjectUsage | 'error' = projectUsage()
    ) {
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      httpMock.expectOne(summaryUrl).flush(emptySummary());
      const usageReq = httpMock.expectOne(`${quotaBaseUrl}/project/${projectId}/quota/usage`);
      if (usage === 'error') {
        usageReq.flush('boom', { status: 500, statusText: 'Server Error' });
      } else {
        usageReq.flush(usage);
      }
      if (org) {
        httpMock.expectOne(`${quotaBaseUrl}/quota`).flush(org);
      }
      const projectReq = httpMock.expectOne(`${quotaBaseUrl}/project/${projectId}/quota`);
      if (projectQuota === 'error') {
        projectReq.flush('boom', { status: 500, statusText: 'Server Error' });
      } else {
        projectReq.flush(projectQuota);
      }

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    /** Text nodes of `el` (icons apart), separated by spaces */
    function leavesText(el: Element): string {
      const texts: string[] = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const text = walker.currentNode.textContent!.trim();
        if (text && !walker.currentNode.parentElement?.closest('mat-icon')) {
          texts.push(text);
        }
      }
      return texts.join(' ');
    }

    function projectText(): string {
      return leavesText(fixture.nativeElement.querySelector('.dashboard__quota-row--total'));
    }

    /** Text of each AZ row, by AZ name */
    function azRows(): Record<string, string> {
      const rows: Element[] = Array.from(
        fixture.nativeElement.querySelectorAll(
          '.dashboard__quota-azs .dashboard__quota-row:not(.dashboard__quota-row--header):not(.dashboard__quota-row--total)'
        )
      );
      return Object.fromEntries(
        rows.map(row => [rowText(row.querySelector('.dashboard__quota-name')!), leavesText(row)])
      );
    }

    function quotasText(): string {
      return rowText(fixture.nativeElement.querySelector('.dashboard__quotas'));
    }

    beforeEach(() => {
      organization.set({ id: orgId });
      project.set({ id: projectId });
      azList.set([
        { code: 'az1', name: 'Zone 1' },
        { code: 'az2', name: 'Zone 2' },
      ]);
    });

    it('should not show nor fetch the quotas without ProjectAZQuotaRead', async () => {
      await createComponent(emptySummary());

      httpMock.expectNone(`${quotaBaseUrl}/project/${projectId}/quota`);
      httpMock.expectNone(`${quotaBaseUrl}/project/${projectId}/quota/usage`);
      expect(fixture.nativeElement.querySelector('.dashboard__quotas')).toBeNull();
    });

    it('should show how full the project and each of its AZs are', async () => {
      TestBed.inject(PermissionService).permissions.set([PermissionsEnum.ProjectAZQuotaRead]);

      await createWithQuotas(projectOverview());

      expect(fixture.nativeElement.querySelector('.dashboard__quota-row--header')?.textContent).toContain(
        'Availability Zones'
      );

      // The project, compared with its own quota
      const projectRow = projectText();
      expect(projectRow).toBe('Total of the project 3.5 vCPU / 8 vCPU 44% 4 GiB / 32 GiB 13% ∞');

      // Each AZ, compared with its own quota, without its share of the project
      const rows = azRows();
      expect(Object.keys(rows)).toEqual(['Zone 1', 'Zone 2']);
      expect(rows['Zone 1']).toBe('Zone 1 3 vCPU / 6 vCPU 50% 4 GiB / 16 GiB 25% ∞');
      // The project limits the memory and az2 has no memory quota: nothing is allocated to it
      expect(rows['Zone 2']).toBe('Zone 2 0.5 vCPU / 2 vCPU 25% Nothing allocated ∞');
      expect(fixture.nativeElement.querySelector('.dashboard__fill--full')).toBeNull();
      const nothingAllocated = fixture.nativeElement.querySelector('.dashboard__fill--nothing-allocated');
      expect(nothingAllocated).toBeTruthy();
      expect(nothingAllocated.querySelector('mat-icon')?.textContent).toBe('warning');
      expect(fixture.nativeElement.querySelector('spx-quota-bar')).toBeNull();
    });

    it('should show in red the AZs and the project whose allocation is full', async () => {
      TestBed.inject(PermissionService).permissions.set([PermissionsEnum.ProjectAZQuotaRead]);
      const usage = projectUsage();
      usage.used = { cpu: '9', memory: '4Gi' };
      usage.azs = [
        { codeAZ: 'az1', available: true, used: { cpu: '7', memory: '4Gi' } },
        { codeAZ: 'az2', available: true, used: { cpu: '2' } },
      ];

      await createWithQuotas(projectOverview(), undefined, usage);

      expect(azRows()['Zone 1']).toContain('7 vCPU / 6 vCPU 117%');
      const full: Element[] = Array.from(fixture.nativeElement.querySelectorAll('.dashboard__fill--full'));
      // CPU of the project (9/8), of Zone 1 (7/6) and of Zone 2 (2/2)
      expect(full.length).toBe(3);
      full.forEach(fill => expect(leavesText(fill)).toMatch(/100%|117%|113%/));
      const meter = full[0].querySelector('.dashboard__fill-meter-value') as HTMLElement;
      expect(meter.style.width).toBe('100%');
    });

    it('should not list the AZs with nothing allocated nor used', async () => {
      TestBed.inject(PermissionService).permissions.set([PermissionsEnum.ProjectAZQuotaRead]);
      azList.set([...azList(), { code: 'az3', name: 'Zone 3' }]);

      await createWithQuotas(projectOverview());

      expect(Object.keys(azRows())).toEqual(['Zone 1', 'Zone 2']);
    });

    it('should apply the organization limits to a project without quota on a resource', async () => {
      TestBed.inject(PermissionService).permissions.set([
        PermissionsEnum.ProjectAZQuotaRead,
        PermissionsEnum.OrganizationProjectQuotaRead,
      ]);

      await createWithQuotas(projectOverview(), {
        organizationId: orgId,
        unlimited: false,
        resources: { cpu: '10', memory: '64Gi', disk: '1Ti' },
        allocated: {},
        projectQuotas: [],
      });

      // The organization limits the disk and the project quota does not: the project gets none
      expect(projectText()).toContain('Nothing allocated');
      expect(azRows()['Zone 1']).toContain('Nothing allocated');
    });

    it('should compare the project with the sum of the AZ quotas when it has no quota', async () => {
      TestBed.inject(PermissionService).permissions.set([PermissionsEnum.ProjectAZQuotaRead]);

      await createWithQuotas({ ...projectOverview(), resources: undefined });

      expect(projectText()).toContain('3.5 vCPU / 8 vCPU 44%');
      // az2 has no memory quota: the project memory is not limited, and az2 memory is not tracked
      expect(projectText()).toContain('4 GiB / ∞');
      expect(azRows()['Zone 2']).toContain('25% ∞');
    });

    it('should link to the quota settings with ProjectAZQuotaRead', async () => {
      TestBed.inject(PermissionService).permissions.set([PermissionsEnum.ProjectAZQuotaRead]);

      await createWithQuotas(projectOverview());

      const trigger = fixture.nativeElement.querySelector('.dashboard__quotas .info-card__title button');
      expect(trigger).toBeTruthy();
      trigger.click();
      fixture.detectChanges();
      const link = document.querySelector('.mat-mdc-menu-panel a[mat-menu-item]') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('/organization/settings#quotas');
    });

    it('should tell when an AZ cannot be reached', async () => {
      TestBed.inject(PermissionService).permissions.set([PermissionsEnum.ProjectAZQuotaRead]);
      const usage = projectUsage();
      usage.complete = false;
      usage.azs![1] = { codeAZ: 'az2', available: false, used: {} };

      await createWithQuotas(projectOverview(), undefined, usage);

      expect(quotasText()).toContain('the usage may be underestimated');
      expect(azRows()['Zone 2']).toBe('Zone 2 Usage unavailable Usage unavailable Usage unavailable');
    });

    it('should tell when no quota applies to the project', async () => {
      TestBed.inject(PermissionService).permissions.set([PermissionsEnum.ProjectAZQuotaRead]);

      await createWithQuotas({ projectId, organizationId: orgId, azQuotas: [] });

      expect(fixture.nativeElement.querySelector('.dashboard__quota-azs')).toBeNull();
      expect(quotasText()).toContain('No quota applies to this project.');
    });

    it('should tell when the usage cannot be loaded', async () => {
      TestBed.inject(PermissionService).permissions.set([PermissionsEnum.ProjectAZQuotaRead]);

      await createWithQuotas(projectOverview(), undefined, 'error');

      expect(fixture.nativeElement.querySelector('.dashboard__quota-azs')).toBeNull();
      expect(quotasText()).toContain('The usage of the project could not be loaded.');
    });

    it('should tell when the quotas cannot be loaded', async () => {
      TestBed.inject(PermissionService).permissions.set([PermissionsEnum.ProjectAZQuotaRead]);

      await createWithQuotas('error');

      expect(quotasText()).toContain('The quotas could not be loaded.');
    });
  });

  describe('recently created', () => {
    it('should list the resources and link to their details page', async () => {
      organization.set({ id: orgId });
      project.set({ id: projectId });

      await createComponent({
        ...emptySummary(),
        recent: [
          {
            id: 'id1',
            eid: 'eid1',
            productName: 'web-01',
            productType: 'instance',
            codeAz: 'az1',
            createdAt: '2026-09-01T10:00:00Z',
          },
          {
            id: 'id2',
            eid: 'eid2',
            productName: 'front-lb',
            productType: 'loadBalancer',
            codeAz: 'az2',
            createdAt: '2026-08-30T10:00:00Z',
          },
        ],
      });

      const rows = fixture.nativeElement.querySelectorAll('.dashboard__row');
      expect(rows[0].querySelector('.dashboard__row-name').textContent.trim()).toBe('web-01');
      expect(rows[0].getAttribute('href')).toBe('/products/compute/instance/details/az1/eid1');
      expect(rows[1].textContent).toContain('Load Balancer');
      expect(rows[1].getAttribute('href')).toBe('/products/network/load-balancer/details/az2/eid2');
      // The chevron is rendered on every row; CSS reveals it on hover.
      expect(rows[0].querySelector('.dashboard__row-chevron')).toBeTruthy();
    });

    it('should show the AZ logo, falling back to the AZ code', async () => {
      organization.set({ id: orgId });
      project.set({ id: projectId });
      azList.set([{ code: 'az1', name: 'Zone 1', logoUrl: 'https://cdn.example.com/az1.svg' }]);

      await createComponent({
        ...emptySummary(),
        recent: [
          {
            id: 'id1',
            eid: 'eid1',
            productName: 'web-01',
            productType: 'instance',
            codeAz: 'az1',
            createdAt: '2026-09-01T10:00:00Z',
          },
          {
            id: 'id2',
            eid: 'eid2',
            productName: 'web-02',
            productType: 'instance',
            codeAz: 'az-unknown',
            createdAt: '2026-08-30T10:00:00Z',
          },
        ],
      });

      const rows = fixture.nativeElement.querySelectorAll('.dashboard__row');
      const logo = rows[0].querySelector('.dashboard__row-logo');
      expect(logo.getAttribute('src')).toBe('https://cdn.example.com/az1.svg');
      expect(logo.getAttribute('title')).toBe('az1');
      expect(rows[1].querySelector('.dashboard__row-logo')).toBeNull();
      expect(rowText(rows[1])).toContain('az-unknown');
    });

    it('should link a product without a details page to its list', async () => {
      organization.set({ id: orgId });
      project.set({ id: projectId });

      await createComponent({
        ...emptySummary(),
        recent: [
          {
            id: 'id1',
            eid: 'eid1',
            productName: 'my-key',
            productType: 'ssh',
            codeAz: 'az1',
            createdAt: '2026-09-01T10:00:00Z',
          },
        ],
      });

      const row = fixture.nativeElement.querySelector('.dashboard__row');
      expect(row.getAttribute('href')).toBe('/products/uncategorized/ssh');
    });

    it('should invite creating a resource when there is none', async () => {
      organization.set({ id: orgId });
      project.set({ id: projectId });

      await createComponent(emptySummary());

      const empty = fixture.nativeElement.querySelector('.dashboard__row-empty');
      expect(empty.textContent).toContain('No resources yet.');
      expect(empty.querySelector('a').getAttribute('href')).toBe('/products/compute/instance/create');
    });
  });

  describe('availability zones', () => {
    beforeEach(() => {
      organization.set({ id: orgId });
      project.set({ id: projectId });
      azList.set([
        { code: 'az1', name: 'Zone 1', logoUrl: 'https://cdn.example.com/az1.svg' },
        { code: 'az2', name: 'Zone 2' },
      ]);
    });

    it('should list only the zones the project has resources in, busiest first', async () => {
      await createComponent({ ...emptySummary(), countsByAz: { az2: 3, az1: 7 } });

      const rows = fixture.nativeElement.querySelectorAll('.dashboard__row');
      expect(rows.length).toBe(2);
      expect(rowText(rows[0])).toBe('Zone 1 7 resources');
      expect(rowText(rows[1])).toBe('Zone 2 3 resources');
    });

    it('should not list a zone the project has no resource in', async () => {
      await createComponent({ ...emptySummary(), countsByAz: { az1: 7 } });

      const rows = fixture.nativeElement.querySelectorAll('.dashboard__row');
      expect(rows.length).toBe(1);
      expect(rowText(rows[0])).toBe('Zone 1 7 resources');
    });

    it('should say resource in the singular for a single one', async () => {
      await createComponent({ ...emptySummary(), countsByAz: { az1: 1 } });

      expect(rowText(fixture.nativeElement.querySelector('.dashboard__row'))).toBe('Zone 1 1 resource');
    });

    it('should show the zone logo only when there is one', async () => {
      await createComponent({ ...emptySummary(), countsByAz: { az1: 7, az2: 3 } });

      const rows = fixture.nativeElement.querySelectorAll('.dashboard__row');
      const logo = rows[0].querySelector('.dashboard__row-logo');
      expect(logo.getAttribute('src')).toBe('https://cdn.example.com/az1.svg');
      expect(logo.getAttribute('title')).toBe('az1');
      expect(rows[1].querySelector('.dashboard__row-logo')).toBeNull();
    });

    it('should fall back to the code for a zone missing from the AZ list', async () => {
      await createComponent({ ...emptySummary(), countsByAz: { 'az-gone': 2 } });

      expect(rowText(fixture.nativeElement.querySelector('.dashboard__row'))).toBe('az-gone 2 resources');
    });

    it('should tell when no zone holds anything', async () => {
      await createComponent(emptySummary());

      const empty = fixture.nativeElement.querySelectorAll('.dashboard__row-empty');
      expect(empty[1].textContent).toContain('No resources in any zone yet.');
    });
  });

  describe('create shortcuts', () => {
    it('should offer a create page on every segment, even with no resource', async () => {
      await createComponent();

      const creates = fixture.nativeElement.querySelectorAll('.dashboard__segment-create');
      expect(creates.length).toBe(4);
      expect(creates[0].getAttribute('href')).toBe('/products/compute/instance/create');
      expect(creates[3].getAttribute('href')).toBe('/products/paas/kaas/create');
    });

    it('should keep the segment itself linking to the product list', async () => {
      await createComponent();

      const main = fixture.nativeElement.querySelector('.dashboard__segment-main');
      expect(main.getAttribute('href')).toBe('/products/compute/instance');
    });
  });

  describe('narrow screens', () => {
    it('should stack the categories below desktop widths', async () => {
      isWeb.set(false);

      await createComponent();

      expect(fixture.nativeElement.querySelector('.dashboard__inventory--stacked')).toBeTruthy();
    });

    it('should keep the categories in a row on desktop', async () => {
      await createComponent();

      expect(fixture.nativeElement.querySelector('.dashboard__inventory--stacked')).toBeNull();
    });

    it('should drop the product type from the recent rows on a phone', async () => {
      isMobile.set(true);
      organization.set({ id: orgId });
      project.set({ id: projectId });

      await createComponent({
        ...emptySummary(),
        recent: [
          {
            id: 'id1',
            eid: 'eid1',
            productName: 'web-01',
            productType: 'instance',
            codeAz: 'az1',
            createdAt: '2026-09-01T10:00:00Z',
          },
        ],
      });

      expect(fixture.nativeElement.querySelector('.dashboard__row--compact')).toBeTruthy();
      // The changelog rail is dropped rather than reflowed on a phone.
      expect(fixture.nativeElement.querySelector('spx-changelog')).toBeNull();
    });
  });

  describe('announcement', () => {
    it('should not show announcement block when no announcement is configured', async () => {
      await createComponent();

      const announcement = fixture.nativeElement.querySelector('.banner');
      expect(announcement).toBeNull();
    });

    it('should show the announcement block with its long text and severity', async () => {
      environment.announcement = { text: 'Short text', longText: 'Detailed long text', severity: 'error' };

      await createComponent();

      const banner = fixture.nativeElement.querySelector('.banner');
      expect(banner.querySelector('.banner__content').textContent).toContain('Detailed long text');
      expect(banner.classList).toContain('banner--error');
    });

    it('should fall back to text when longText is not provided', async () => {
      environment.announcement = { text: 'Short text only', severity: 'info' };

      await createComponent();

      const banner = fixture.nativeElement.querySelector('.banner');
      expect(banner.querySelector('.banner__content').textContent).toContain('Short text only');
      expect(banner.classList).toContain('banner--info');
    });
  });
});
