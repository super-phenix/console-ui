import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProductDBaaS } from '@products/00_shared/models/product.model';
import { DBaaSDetailsSettingsComponent } from './dbaas-details-settings.component';

describe('DBaaSDetailsSettingsComponent', () => {
  let component: DBaaSDetailsSettingsComponent;
  let fixture: ComponentFixture<DBaaSDetailsSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DBaaSDetailsSettingsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DBaaSDetailsSettingsComponent);
    component = fixture.componentInstance;
  });

  const cases: { name: string; gitops: ProductDBaaS['gitops']; expected: boolean }[] = [
    { name: 'console managed', gitops: 'false', expected: false },
    { name: 'GitOps managed', gitops: 'true', expected: true },
  ];

  cases.forEach(({ name, gitops, expected }) => {
    it(`detects a ${name} database`, async () => {
      const db: ProductDBaaS = { id: '1', eid: 'db-1', productName: 'db-1', gitops };
      fixture.componentRef.setInput('db', db);
      await fixture.whenStable();
      expect(component.isGitops()).toBe(expected);
    });
  });
});
