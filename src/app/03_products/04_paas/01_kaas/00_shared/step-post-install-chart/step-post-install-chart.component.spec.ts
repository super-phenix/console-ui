import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepPostInstallChartComponent } from './step-post-install-chart.component';

describe('StepPostInstallChartComponent', () => {
  let component: StepPostInstallChartComponent;
  let fixture: ComponentFixture<StepPostInstallChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepPostInstallChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepPostInstallChartComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
