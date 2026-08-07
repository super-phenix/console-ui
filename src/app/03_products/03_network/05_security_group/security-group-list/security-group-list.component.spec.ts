import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityGroupListComponent } from './security-group-list.component';

describe('SecurityGroupListComponent', () => {
  let component: SecurityGroupListComponent;
  let fixture: ComponentFixture<SecurityGroupListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityGroupListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityGroupListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
