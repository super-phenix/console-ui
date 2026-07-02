import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepLabelComponent } from './step-label.component';

describe('StepLabelComponent', () => {
  let component: StepLabelComponent;
  let fixture: ComponentFixture<StepLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepLabelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepLabelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
