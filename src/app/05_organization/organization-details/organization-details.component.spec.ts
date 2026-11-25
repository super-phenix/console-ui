import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Organization } from '@shared/models/data/organization';
import { StateService } from '@shared/services/state.service';

import { OrganizationDetailsComponent } from './organization-details.component';

describe('OrganizationDetailsComponent', () => {
  let component: OrganizationDetailsComponent;
  let fixture: ComponentFixture<OrganizationDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationDetailsComponent],
    }).compileComponents();

    TestBed.inject(StateService).organization.set({ id: 'org', projects: [] } as unknown as Organization);
    fixture = TestBed.createComponent(OrganizationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
