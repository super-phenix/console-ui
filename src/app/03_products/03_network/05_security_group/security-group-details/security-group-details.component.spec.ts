import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityGroupDetailsComponent } from './security-group-details.component';

describe('SecurityGroupDetailsComponent', () => {
  let component: SecurityGroupDetailsComponent;
  let fixture: ComponentFixture<SecurityGroupDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityGroupDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityGroupDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
