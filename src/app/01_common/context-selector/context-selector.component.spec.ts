import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSelect } from '@angular/material/select';
import { Organization } from '@shared/models/data/organization';
import { User } from '@shared/models/data/user';
import { AuthService } from '@shared/services/auth.service';
import { OrganizationService } from '@shared/services/organization.service';
import { StateService } from '@shared/services/state.service';

import { ContextSelectorComponent } from './context-selector.component';

function org(id: string, name: string): Organization {
  return { id, name, ownerId: 'user', projects: [] } as unknown as Organization;
}

describe('ContextSelectorComponent', () => {
  let component: ContextSelectorComponent;
  let fixture: ComponentFixture<ContextSelectorComponent>;
  let setOrganization: jasmine.Spy;
  let organization: WritableSignal<Organization | undefined>;

  beforeEach(async () => {
    const user = {
      id: 'user',
      personalOrg: [org('1', 'org10'), org('2', 'HGTY')],
      guestOrg: [org('3', 'dfgt'), org('4', 'ABCD'), org('5', 'org2')],
    } as unknown as User;
    setOrganization = jasmine.createSpy('setOrganization');
    organization = signal<Organization | undefined>(undefined);

    await TestBed.configureTestingModule({
      imports: [ContextSelectorComponent],
      providers: [
        { provide: AuthService, useValue: { user: signal(user) } },
        {
          provide: StateService,
          useValue: { organization: organization, project: signal(undefined), setOrganization },
        },
        { provide: OrganizationService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list the main personal organization first, then the other personal ones, then the guest ones, each sorted ignoring case and comparing numbers by value', () => {
    expect(component.orgList().map(o => o.name)).toEqual(['org10', 'HGTY', 'ABCD', 'dfgt', 'org2']);
  });

  it('should filter organizations by a case-insensitive substring', () => {
    component.orgFilter.set('DF');
    expect(component.filteredOrgList().map(o => o.name)).toEqual(['dfgt']);

    component.orgFilter.set('org');
    expect(component.filteredOrgList().map(o => o.name)).toEqual(['org10', 'org2']);

    component.orgFilter.set('zzz');
    expect(component.filteredOrgList()).toEqual([]);
  });

  it('should reset the filter when the select closes', () => {
    component.orgFilter.set('DF');
    component.orgSelectOpened(false);
    expect(component.orgFilter()).toBe('');
  });

  it('should select the first match on Enter', () => {
    const select = jasmine.createSpyObj<MatSelect>('MatSelect', ['close']);
    component.orgFilter.set('h');
    component.onOrgSearchKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), select);

    expect(select.close).toHaveBeenCalled();
    expect(setOrganization).toHaveBeenCalledWith('2');
  });

  it('should keep the selected organization in the trigger when the filter hides it', async () => {
    organization.set(org('4', 'ABCD'));
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('#orgSelect .mat-mdc-select-trigger') as HTMLElement;
    trigger.click();
    await fixture.whenStable();

    component.orgFilter.set('zzz');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.context-selector__organization-selection')?.textContent).toContain('ABCD');
  });

  it('should show the search field and only the matching options in the opened panel', async () => {
    const trigger = fixture.nativeElement.querySelector('#orgSelect .mat-mdc-select-trigger') as HTMLElement;
    trigger.click();
    await fixture.whenStable();

    const input = document.querySelector('.context-selector__search input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(document.activeElement).toBe(input);
    input.value = 'DF';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const options = Array.from(document.querySelectorAll('mat-option:not(.context-selector__option--hidden)')).map(o =>
      o.textContent?.trim(),
    );
    expect(options.length).toBe(1);
    expect(options[0]).toContain('dfgt');
  });

  it('should keep typed keys away from mat-select', () => {
    const event = new KeyboardEvent('keydown', { key: 'a' });
    spyOn(event, 'stopPropagation');
    component.onOrgSearchKeydown(event, jasmine.createSpyObj<MatSelect>('MatSelect', ['close']));
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('should list the "default" project first, then the others sorted', () => {
    const projects = ['proj10', 'zeta', 'default', 'proj2'].map(name => ({ id: name, name }));
    organization.set({ ...org('1', 'org'), projects } as unknown as Organization);
    expect(component.projectList().map(p => p.name)).toEqual(['default', 'proj2', 'proj10', 'zeta']);
  });

  it('should still list the projects when "default" has been deleted or the organization has no projects', () => {
    const projects = ['zeta', 'alpha'].map(name => ({ id: name, name }));
    organization.set({ ...org('1', 'org'), projects } as unknown as Organization);
    expect(component.projectList().map(p => p.name)).toEqual(['alpha', 'zeta']);

    organization.set({ ...org('1', 'org'), projects: undefined } as unknown as Organization);
    expect(component.projectList()).toEqual([]);
    organization.set(undefined);
    expect(component.projectList()).toEqual([]);
  });

  it('should forward arrows to mat-select once, and leave Enter to it once the user navigated', () => {
    const select = jasmine.createSpyObj<MatSelect>('MatSelect', ['close', '_handleKeydown']);
    const arrow = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    spyOn(arrow, 'stopPropagation');
    component.onOrgSearchKeydown(arrow, select);
    expect(arrow.stopPropagation).toHaveBeenCalled();
    expect(select._handleKeydown).toHaveBeenCalledOnceWith(arrow);

    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    component.onOrgSearchKeydown(enter, select);
    expect(select._handleKeydown).toHaveBeenCalledWith(enter);
    expect(select.close).not.toHaveBeenCalled();
    expect(setOrganization).not.toHaveBeenCalled();

    // typing again goes back to "Enter picks the first match"
    component.orgFilter.set('h');
    component.onOrgSearchKeydown(new KeyboardEvent('keydown', { key: 'h' }), select);
    component.onOrgSearchKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), select);
    expect(setOrganization).toHaveBeenCalledWith('2');
  });
});
