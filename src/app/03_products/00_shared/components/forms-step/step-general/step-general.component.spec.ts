import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepGeneralComponent } from './step-general.component';

describe('StepGeneralComponent', () => {
  let component: StepGeneralComponent;
  let fixture: ComponentFixture<StepGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepGeneralComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepGeneralComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
