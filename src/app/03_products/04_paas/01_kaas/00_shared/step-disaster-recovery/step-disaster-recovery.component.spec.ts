import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepDisasterRecoveryComponent } from './step-disaster-recovery.component';

describe('StepDisasterRecoveryComponent', () => {
  let component: StepDisasterRecoveryComponent;
  let fixture: ComponentFixture<StepDisasterRecoveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepDisasterRecoveryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepDisasterRecoveryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
