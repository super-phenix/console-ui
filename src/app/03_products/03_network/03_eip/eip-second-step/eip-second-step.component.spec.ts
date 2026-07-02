import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EipSecondStepComponent } from './eip-second-step.component';

describe('EipSecondStepComponent', () => {
  let component: EipSecondStepComponent;
  let fixture: ComponentFixture<EipSecondStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EipSecondStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EipSecondStepComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
