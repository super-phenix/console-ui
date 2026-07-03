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

  it('should not show warning when not disabled', () => {
    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('disabledTooltip', '');
    fixture.detectChanges();
    const warn = fixture.nativeElement.querySelector('.color-warn');
    expect(warn).toBeNull();
  });

  it('should show warning message when disabled with tooltip', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('disabledTooltip', 'Cannot change the dedicated datastore when the Kubernetes version is also changed');
    fixture.detectChanges();
    const warn = fixture.nativeElement.querySelector('.color-warn');
    expect(warn).toBeTruthy();
    expect(warn.textContent).toContain('Warning:');
    expect(warn.textContent).toContain('Cannot change the dedicated datastore');
    expect(warn.textContent).toContain('reset to its original value');
  });

  it('should not show warning when disabled but no tooltip', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('disabledTooltip', '');
    fixture.detectChanges();
    const warn = fixture.nativeElement.querySelector('.color-warn');
    expect(warn).toBeNull();
  });
});
