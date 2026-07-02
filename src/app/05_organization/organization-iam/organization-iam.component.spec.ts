import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationIamComponent } from './organization-iam.component';

describe('OrganizationIamComponent', () => {
  let component: OrganizationIamComponent;
  let fixture: ComponentFixture<OrganizationIamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationIamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationIamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
