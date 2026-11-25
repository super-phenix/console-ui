import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { EipSecondStepComponent } from './eip-second-step.component';

describe('EipSecondStepComponent', () => {
  let component: EipSecondStepComponent;
  let fixture: ComponentFixture<EipSecondStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EipSecondStepComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EipSecondStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'formGroup',
      new FormGroup({
        type: new FormControl('ip'),
        ip: new FormControl(''),
        snat: new FormArray([]),
        dnat: new FormArray([]),
      })
    );
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
