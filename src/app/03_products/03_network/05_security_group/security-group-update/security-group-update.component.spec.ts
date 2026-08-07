import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityGroupUpdateComponent } from './security-group-update.component';

describe('SecurityGroupUpdateComponent', () => {
  let component: SecurityGroupUpdateComponent;
  let fixture: ComponentFixture<SecurityGroupUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityGroupUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityGroupUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
