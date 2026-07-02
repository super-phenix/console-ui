import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { KaasCreateComponent } from './kaas-create.component';

describe('KaasCreateComponent', () => {
  let component: KaasCreateComponent;
  let fixture: ComponentFixture<KaasCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KaasCreateComponent],
      providers: [provideRouter([]), provideHttpClient()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(KaasCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('gates Disaster Recovery on Kubernetes >= 1.35 (tolerating a "v" prefix)', () => {
    component.firstFormGroup.controls.kubeVersion.setValue('v1.34.5');
    expect(component.drSupported()).toBe(false);

    component.firstFormGroup.controls.kubeVersion.setValue('v1.35.5');
    expect(component.drSupported()).toBe(true);
  });

  it('clears the DR toggle when the version drops below 1.35', () => {
    component.firstFormGroup.controls.kubeVersion.setValue('v1.35.5');
    fixture.detectChanges();
    component.disasterRecovery.set(true);

    component.firstFormGroup.controls.kubeVersion.setValue('v1.34.5');
    fixture.detectChanges();
    expect(component.disasterRecovery()).toBe(false);
  });
});
