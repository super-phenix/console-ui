import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ProductSSH } from '@products/00_shared/models/product.model';
import { SshService } from '@products/00_shared/services/ssh.service';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';

import { SshUsageDialog } from '../ssh-usage-dialog/ssh-usage-dialog.component';
import { SshListComponent } from './ssh-list.component';

describe('SshListComponent', () => {
  let component: SshListComponent;
  let fixture: ComponentFixture<SshListComponent>;
  const permissions = signal<PermissionsEnum[]>([]);

  beforeEach(() => permissions.set([PermissionsEnum.ProjectSSHWrite, PermissionsEnum.ProjectInstanceRead]));

  async function setup(keys: Partial<ProductSSH>[]) {
    await TestBed.configureTestingModule({
      imports: [SshListComponent],
      providers: [
        provideRouter([]),
        { provide: SshService, useValue: { list: () => of(keys) } },
        {
          provide: StateService,
          useValue: { organization: signal({ id: 'org' }), project: signal({ id: 'project' }), azList: signal([]) },
        },
        { provide: PermissionService, useValue: { permissions } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SshListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function openMenu() {
    fixture.debugElement.query(By.directive(MatMenuTrigger)).injector.get(MatMenuTrigger).openMenu();
    fixture.detectChanges();
  }

  const deleteButton = () => document.querySelector<HTMLButtonElement>('button[aria-label="Delete ssh button"]');
  const usageButton = () => document.querySelector<HTMLButtonElement>('button[aria-label="See usage button"]');

  it('should create', async () => {
    await setup([]);
    expect(component).toBeTruthy();
  });

  const isUsedCases: { name: string; isUsed?: boolean; want: boolean }[] = [
    { name: 'field absent', want: false },
    { name: 'unused key', isUsed: false, want: false },
    { name: 'key in use', isUsed: true, want: true },
  ];

  isUsedCases.forEach(({ name, isUsed, want }) => {
    it(`should show the state of the key and guard Delete: ${name}`, async () => {
      await setup([{ eid: 'key-1', codeAZ: 'az1', isUsed }]);

      expect(!!fixture.nativeElement.querySelector('mat-icon[aria-label="Used"]')).toBe(want);
      openMenu();
      expect(deleteButton()!.getAttribute('aria-disabled')).toBe(String(want));
      expect(deleteButton()!.textContent).toContain(want ? 'In use by an instance, cannot delete' : 'Delete');
    });
  });

  const usageCases: { name: string; isUsed: boolean; granted: PermissionsEnum[]; want: boolean }[] = [
    { name: 'used key, instance read', isUsed: true, granted: [PermissionsEnum.ProjectInstanceRead], want: true },
    { name: 'used key, no instance read', isUsed: true, granted: [PermissionsEnum.ProjectSSHWrite], want: false },
    { name: 'unused key', isUsed: false, granted: [PermissionsEnum.ProjectInstanceRead], want: false },
  ];

  usageCases.forEach(({ name, isUsed, granted, want }) => {
    it(`should offer See Usage only when useful: ${name}`, async () => {
      permissions.set(granted);
      await setup([{ eid: 'key-1', codeAZ: 'az1', isUsed }]);

      openMenu();
      expect(!!usageButton()).toBe(want);
    });
  });

  it('should open the usage dialog of the key', async () => {
    await setup([{ eid: 'key-1', codeAZ: 'az1', productName: 'my-key', isUsed: true }]);
    const open = spyOn(TestBed.inject(MatDialog), 'open');

    openMenu();
    usageButton()!.click();

    expect(open).toHaveBeenCalledTimes(1);
    expect(open.calls.mostRecent().args[0]).toBe(SshUsageDialog);
    expect(open.calls.mostRecent().args[1]?.data).toEqual({
      orgaId: 'org',
      projectId: 'project',
      az: 'az1',
      eid: 'key-1',
      name: 'my-key',
    });
  });
});
