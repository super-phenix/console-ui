import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityGroupCreateComponent } from './security-group-create.component';

describe('SecurityGroupCreateComponent', () => {
  let component: SecurityGroupCreateComponent;
  let fixture: ComponentFixture<SecurityGroupCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityGroupCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityGroupCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
