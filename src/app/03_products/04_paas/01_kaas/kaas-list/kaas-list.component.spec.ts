import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductKaaS } from '@products/00_shared/models/product.model';
import { KaasService } from '@products/00_shared/services/kaas.service';
import { StateService } from '@shared/services/state.service';
import { of, throwError } from 'rxjs';

import { KaasListComponent } from './kaas-list.component';

describe('KaasListComponent', () => {
  async function setup(list: KaasService['list']) {
    await TestBed.configureTestingModule({
      imports: [KaasListComponent],
      providers: [
        provideRouter([]),
        { provide: KaasService, useValue: { list } },
        {
          provide: StateService,
          useValue: { organization: signal({ id: 'org' }), project: signal({ id: 'project' }), azList: signal([]) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(KaasListComponent);
    await fixture.whenStable();
    return fixture.componentInstance;
  }

  const cluster = (eid: string, outdated?: boolean) =>
    ({ eid, productName: eid, codeAZ: 'az1', outdated }) as ProductKaaS;

  const cases: { name: string; list: KaasService['list']; want: boolean }[] = [
    { name: 'one outdated cluster', list: () => of([cluster('a', false), cluster('b', true)]), want: true },
    { name: 'no outdated cluster', list: () => of([cluster('a', false), cluster('b')]), want: false },
    { name: 'no cluster', list: () => of([]), want: false },
    { name: 'failed list', list: () => throwError(() => new Error('down')), want: false },
  ];

  cases.forEach(({ name, list, want }) => {
    it(`should tell whether a cluster is outdated: ${name}`, async () => {
      spyOn(console, 'error');
      const component = await setup(list);
      expect(component.hasOutdatedCluster()).toBe(want);
    });
  });
});
