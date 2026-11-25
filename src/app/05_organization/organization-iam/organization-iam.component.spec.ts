import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Organization } from '@shared/models/data/organization';
import { StateService } from '@shared/services/state.service';

import { OrganizationIamComponent } from './organization-iam.component';

describe('OrganizationIamComponent', () => {
  let component: OrganizationIamComponent;
  let fixture: ComponentFixture<OrganizationIamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationIamComponent],
    }).compileComponents();

    TestBed.inject(StateService).organization.set({ id: 'org', projects: [] } as unknown as Organization);
    fixture = TestBed.createComponent(OrganizationIamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
