import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { SSHUser } from '@products/00_shared/models/uncategorized/ssh/ssh.model';
import { SshService } from '@products/00_shared/services/ssh.service';
import { Observable, of, throwError } from 'rxjs';

import { SshUsageDialog, SshUsageDialogData } from './ssh-usage-dialog.component';

describe('SshUsageDialog', () => {
  let fixture: ComponentFixture<SshUsageDialog>;
  let getUsage: jasmine.Spy;

  const data: SshUsageDialogData = { orgaId: 'org', projectId: 'project', az: 'az1', eid: 'key-1', name: 'my-key' };

  async function setup(usage: Observable<SSHUser[]>) {
    getUsage = jasmine.createSpy('getUsage').and.returnValue(usage);
    await TestBed.configureTestingModule({
      imports: [SshUsageDialog],
      providers: [
        provideRouter([]),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: SshService, useValue: { getUsage } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SshUsageDialog);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const text = () => (fixture.nativeElement as HTMLElement).textContent;

  it('should request the usage of the key', async () => {
    await setup(of([]));
    expect(getUsage).toHaveBeenCalledOnceWith('org', 'project', 'az1', 'key-1');
    expect(text()).toContain('Usage of my-key');
  });

  it('should list the instances with a link to their details', async () => {
    await setup(
      of([
        { eid: 'vm-1', productName: 'web' },
        { eid: 'vm-2', productName: '' },
      ])
    );

    const rows = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('mat-row'));
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('vm-1');
    expect(rows[0].textContent).toContain('web');
    expect(rows[1].textContent).toContain('vm-2');

    const links = rows.map(row => row.querySelector('a')!);
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      '/products/compute/instance/details/az1/vm-1',
      '/products/compute/instance/details/az1/vm-2',
    ]);
    expect(links.map(link => link.getAttribute('aria-label'))).toEqual([
      'See details of VM web',
      'See details of VM vm-2',
    ]);
  });

  it('should keep a full EID on one line', async () => {
    const eid = 'spx-47124ad6-748a-544b-9ed8-ce6f193408d9';
    await setup(of([{ eid, productName: 'web' }]));

    const cell: HTMLElement = fixture.nativeElement.querySelector('mat-cell.mat-column-eid');
    const header: HTMLElement = fixture.nativeElement.querySelector('mat-header-cell.mat-column-eid');
    expect(cell.textContent!.trim()).toBe(eid);
    expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth);
    expect(header.getBoundingClientRect().width).toBe(cell.getBoundingClientRect().width);
  });

  const emptyCases: { name: string; usage: Observable<SSHUser[]>; want: string }[] = [
    { name: 'no instance', usage: of([]), want: 'No instance uses this SSH key.' },
    {
      name: 'request failure',
      usage: throwError(() => new Error('failed')),
      want: 'Failed to retrieve the usage of this SSH key.',
    },
  ];

  emptyCases.forEach(({ name, usage, want }) => {
    it(`should show a message: ${name}`, async () => {
      await setup(usage);
      expect(text()).toContain(want);
      expect(fixture.nativeElement.querySelector('mat-table')).toBeNull();
    });
  });
});
