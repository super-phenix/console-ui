import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_ENDPOINT, HTTP_PROTOCOL, environment } from '@env/environment';
import {
  OrganizationQuotaOverview,
  ProjectQuotaOverview,
  QuotaOrganizationUsage,
  QuotaResourceEnum,
} from '@shared/models/data/quota';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';

import { OrganizationQuotasComponent } from './organization-quotas.component';

describe('OrganizationQuotasComponent', () => {
  const orgId = 'org1';
  const baseUrl = `${HTTP_PROTOCOL}${environment.apiUrl}${API_ENDPOINT}/organization/${orgId}`;
  const GI = 2 ** 30;

  let component: OrganizationQuotasComponent;
  let fixture: ComponentFixture<OrganizationQuotasComponent>;
  let httpMock: HttpTestingController;

  const organization = signal<unknown>(undefined);
  const azList = signal([
    { code: 'az1', name: 'Zone 1' },
    { code: 'az2', name: 'Zone 2' },
  ]);
  const stateSvcStub = { organization, azList };

  const projects = [
    { id: 'p1', name: 'Project 1' },
    { id: 'p2', name: 'Project 2' },
  ];

  function orgOverview(): OrganizationQuotaOverview {
    return {
      organizationId: orgId,
      unlimited: false,
      resources: { cpu: '10', memory: '100Gi' },
      allocated: { cpu: '12', memory: '40Gi' },
      remaining: { cpu: '0', memory: '60Gi' },
      projectQuotas: [
        { ProjectId: 'p1', OrganizationId: orgId, Resources: { cpu: '4', memory: '40Gi' } },
        { ProjectId: 'p2', OrganizationId: orgId, Resources: { cpu: '8' } },
      ],
    };
  }

  function projectOverviews(): Record<string, ProjectQuotaOverview> {
    return {
      p1: {
        projectId: 'p1',
        organizationId: orgId,
        resources: { cpu: '4', memory: '40Gi' },
        azQuotas: [
          { ID: 'q1', ProjectId: 'p1', CodeAZ: 'az1', Resources: { cpu: '2', memory: '20Gi' } },
          { ID: 'q2', ProjectId: 'p1', CodeAZ: 'az2', Resources: { cpu: '1' } },
        ],
      },
      p2: { projectId: 'p2', organizationId: orgId, resources: { cpu: '8' }, azQuotas: [] },
    };
  }

  function orgUsage(): QuotaOrganizationUsage {
    return {
      organizationId: orgId,
      complete: false,
      used: { cpu: '3500m', memory: '25Gi' },
      projects: [
        {
          projectId: 'p1',
          complete: false,
          used: { cpu: '2500m', memory: '25Gi' },
          azs: [
            { codeAZ: 'az1', available: true, used: { cpu: '2500m', memory: '25Gi' } },
            { codeAZ: 'az2', available: false, used: {} },
          ],
        },
        {
          projectId: 'p2',
          complete: true,
          used: { cpu: '1' },
          azs: [
            { codeAZ: 'az1', available: true, used: { cpu: '1' } },
            { codeAZ: 'az2', available: true, used: {} },
          ],
        },
      ],
    };
  }

  /** Usage answer: `'pending'` to leave the request pending, `null` to fail it */
  async function createComponent(
    overview: OrganizationQuotaOverview = orgOverview(),
    permissionsByProject: Record<string, string[]> = { p1: [PermissionsEnum.ProjectAZQuotaWrite], p2: [] },
    usage: QuotaOrganizationUsage | null | 'pending' = orgUsage()
  ) {
    organization.set({ id: orgId, projects });
    fixture = TestBed.createComponent(OrganizationQuotasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const usageRequest = httpMock.expectOne(`${baseUrl}/quota/usage`);
    if (usage === null) {
      usageRequest.flush('error', { status: 500, statusText: 'Internal Server Error' });
    } else if (usage !== 'pending') {
      usageRequest.flush(usage);
    }
    httpMock.expectOne(`${baseUrl}/quota`).flush(overview);
    const overviews = projectOverviews();
    for (const p of projects) {
      httpMock.expectOne(`${baseUrl}/project/${p.id}/quota`).flush(overviews[p.id]);
    }
    const permissionRequests = httpMock.match(`${baseUrl}/iam/permissions`);
    expect(permissionRequests.length).toBe(projects.length);
    permissionRequests.forEach(req => req.flush(permissionsByProject[req.request.body.entityId] ?? []));

    // Let the loading promise settle before rendering
    await new Promise(resolve => setTimeout(resolve));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function text(el: Element | null): string {
    return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  beforeEach(async () => {
    organization.set(undefined);

    await TestBed.configureTestingModule({
      imports: [OrganizationQuotasComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: StateService, useValue: stateSvcStub }],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(PermissionService).permissions.set([
      PermissionsEnum.OrganizationProjectQuotaRead,
      PermissionsEnum.OrganizationProjectQuotaWrite,
    ]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should split the organization quota among the projects and display free space in the legend', async () => {
    await createComponent();

    const [cpu, memory, disk] = component.orgBars();
    expect(cpu.limit).toBe(10000);
    expect(cpu.parts.map(p => p.value)).toEqual([4000, 8000]);
    expect(memory.parts.map(p => p.value)).toEqual([40 * GI, 0]);
    expect(disk.limit).toBeNull();

    const orgCard = fixture.nativeElement.querySelector('.org-quotas__org');
    const bars = orgCard.querySelectorAll('spx-quota-bar');
    expect(bars.length).toBe(3);
    expect(text(bars[0].querySelector('.quota-bar__summary'))).toContain('12 vCPU allocated / 10 vCPU');
    expect(bars[0].querySelector('.quota-bar--overcommitted')).toBeTruthy();
    expect(text(bars[1].querySelector('.quota-bar__summary'))).toBe('40 GiB allocated / 100 GiB');

    // Free space appears in the legend with its amount, percentage and patterned dot
    const memoryLegendItems: Element[] = Array.from(bars[1].querySelectorAll('.quota-bar__legend-item'));
    const freeItem = memoryLegendItems.find(el => text(el).includes('Free'));
    expect(freeItem).toBeTruthy();
    expect(text(freeItem!)).toContain('Free 60 GiB (60%)');
    expect(freeItem?.querySelector('.quota-bar__dot--free')).toBeTruthy();
  });

  it('should split each project quota among the AZs', async () => {
    await createComponent();

    const [p1] = component.projectViews();
    const cpu = p1.bars.find(b => b.resource === QuotaResourceEnum.CPU)!;
    expect(cpu.limit).toBe(4000);
    expect(cpu.parts.map(p => p.value)).toEqual([2000, 1000]);

    // A resource limited by a parent without AZ allocation is enforced at 0
    expect(p1.azRows[1].cells[QuotaResourceEnum.Memory].value).toBe('0 B allocated');
    // Not limited by any level
    expect(p1.azRows[0].cells[QuotaResourceEnum.Disk].value).toBe('Unlimited');
  });

  it('should nest the projects inside the organization card, with their color in its bars', async () => {
    await createComponent();

    const orgCard = fixture.nativeElement.querySelector('.org-quotas__org');
    const children = orgCard.querySelector('.org-quotas__children');
    expect(children).toBeTruthy();
    expect(children.querySelectorAll('.org-quotas__child .org-quotas__project').length).toBe(2);
    const dots = children.querySelectorAll('.org-quotas__project .org-quotas__dot');
    expect(dots[0].classList).toContain('org-quotas__color-0');
    expect(dots[1].classList).toContain('org-quotas__color-1');
  });

  it('should minimize projects by default and maximize them when clicked', async () => {
    await createComponent();

    const orgCard = fixture.nativeElement.querySelector('.org-quotas__org');
    const projectHeader = orgCard.querySelector('.org-quotas__project-header') as HTMLElement;
    expect(orgCard.querySelector('.org-quotas__project .info-card__content')).toBeNull();

    projectHeader.click();
    fixture.detectChanges();

    expect(component.isExpanded('p1')).toBeTrue();
    const p1Card = orgCard.querySelector('[data-project-id="p1"]');
    expect(p1Card.querySelectorAll('spx-quota-bar').length).toBe(3);

    projectHeader.click();
    fixture.detectChanges();
    expect(component.isExpanded('p1')).toBeFalse();
  });

  it('should only show the allocation in the bars, without the usage', async () => {
    await createComponent();
    component.expandedProjects.set(new Set(['p1', 'p2']));
    fixture.detectChanges();

    const bars: Element[] = Array.from(fixture.nativeElement.querySelectorAll('spx-quota-bar'));
    expect(bars.length).toBe(9);
    bars.forEach(bar => expect(text(bar)).not.toContain('used'));
    expect(fixture.nativeElement.querySelector('.quota-bar__usage')).toBeNull();
  });

  it('should show what each AZ and each project uses in the AZ table', async () => {
    await createComponent();
    component.expandedProjects.set(new Set(['p1', 'p2']));
    fixture.detectChanges();

    const [p1, p2] = component.projectViews();
    expect(p1.usageComplete).toBeFalse();
    expect(p2.usageComplete).toBeTrue();

    const memoryCell = p1.azRows[0].cells[QuotaResourceEnum.Memory];
    expect(memoryCell.usage).toEqual({ text: '25 GiB used', percent: 100, over: true });
    // az2 could not be reached
    expect(p1.azRows[1].cells[QuotaResourceEnum.CPU].usage?.text).toBe('Usage unavailable');
    // Not limited by anyone: not tracked by Kubernetes
    expect(p1.azRows[0].cells[QuotaResourceEnum.Disk].usage).toBeUndefined();

    // Total of the project, compared with what it takes from the organization quota
    expect(p1.totalCells[QuotaResourceEnum.CPU]).toEqual({
      value: '4 vCPU allocated',
      usage: { text: '2.5 vCPU used', percent: 62.5, over: false },
    });
    expect(p1.totalCells[QuotaResourceEnum.Disk].usage).toBeUndefined();
    // Limited at 0 by the organization: tracked, so 0 allocated and marked as full/over
    expect(p2.totalCells[QuotaResourceEnum.Memory].usage).toEqual({ text: '0 B used', percent: 100, over: true });

    const card = fixture.nativeElement.querySelector('.org-quotas__project');
    // CPU and RAM of Zone 1 exceed their quota
    expect(card.querySelectorAll('.org-quotas__meter--over').length).toBe(2);
    const total = card.querySelector('.org-quotas__az-row--total');
    expect(text(total)).toContain('4 vCPU allocated 2.5 vCPU used 40 GiB allocated 25 GiB used');
    expect(text(card)).toContain('the usage of this project may be underestimated');
  });

  it('should display the quotas while the usage is loading', async () => {
    await createComponent(orgOverview(), undefined, 'pending');

    expect(component.projectViews()[0].azRows[0].cells[QuotaResourceEnum.CPU].usage).toBeUndefined();
    expect(component.projectViews()[0].totalCells[QuotaResourceEnum.CPU].usage).toBeUndefined();
    expect(text(fixture.nativeElement.querySelector('.org-quotas__children'))).toContain('Reading the usage');
    expect(fixture.nativeElement.querySelectorAll('.org-quotas__project').length).toBe(2);
  });

  it('should tell when the usage cannot be loaded', async () => {
    await createComponent(orgOverview(), undefined, null);

    expect(component.projectViews()[0].azRows[0].cells[QuotaResourceEnum.CPU].usage?.text).toBe('Usage unavailable');
    expect(component.projectViews()[0].totalCells[QuotaResourceEnum.CPU].usage?.text).toBe('Usage unavailable');
    expect(text(fixture.nativeElement.querySelector('.org-quotas__children'))).toContain(
      'The usage could not be loaded'
    );
  });

  it('should only allow editing the AZ quotas with ProjectAZQuotaWrite', async () => {
    await createComponent();
    component.expandedProjects.set(new Set(['p1', 'p2']));
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.org-quotas__project');
    expect(cards[0].querySelector('.org-quotas__az-row--header')?.textContent).toContain('Availability Zones');
    expect(cards[0].querySelectorAll('.org-quotas__az-actions button').length).toBe(2);
    expect(cards[1].querySelectorAll('.org-quotas__az-actions button').length).toBe(0);
  });

  it('should show "Unlimited" badge when a project has no quota', async () => {
    const overviewWithoutP2Quota = {
      ...orgOverview(),
      projectQuotas: [{ ProjectId: 'p1', OrganizationId: orgId, Resources: { cpu: '4', memory: '40Gi' } }],
    };
    await createComponent(overviewWithoutP2Quota);

    const projectCards = fixture.nativeElement.querySelectorAll('.org-quotas__project');
    expect(projectCards.length).toBe(2);
    const p2Badge = projectCards[1].querySelector('.org-quotas__badge');
    expect(p2Badge?.textContent?.trim()).toBe('Unlimited');
  });

  it('should only allow removing a project quota when the organization is unlimited', async () => {
    await createComponent();
    expect(component.projectViews().every(v => !component.canRemoveProjectQuota(v))).toBeTrue();
  });

  it('should show the organization as unlimited', async () => {
    await createComponent({ ...orgOverview(), unlimited: true, resources: undefined, remaining: undefined });

    expect(component.orgBars().every(b => b.limit === null)).toBeTrue();
    expect(text(fixture.nativeElement.querySelector('.org-quotas__org .org-quotas__badge'))).toBe('Unlimited');
    expect(component.projectViews().every(v => component.canRemoveProjectQuota(v))).toBeTrue();
  });
});
