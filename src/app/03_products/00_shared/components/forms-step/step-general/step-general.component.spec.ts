import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AZ } from '@products/00_shared/models/product.model';
import { StateService } from '@shared/services/state.service';

import { StepGeneralComponent } from './step-general.component';

describe('StepGeneralComponent', () => {
  let component: StepGeneralComponent;
  let fixture: ComponentFixture<StepGeneralComponent>;

  const mockAzList: AZ[] = [
    { code: 'az1', name: 'Zone 1', logoUrl: 'https://cdn.example.com/az1.svg' },
    { code: 'az2', name: 'Zone 2', logoUrl: 'https://cdn.example.com/az2.svg' },
  ];

  const azListSignal = signal<AZ[]>(mockAzList);

  beforeEach(async () => {
    azListSignal.set(mockAzList);
    const stateSvcStub = { azList: azListSignal };

    await TestBed.configureTestingModule({
      imports: [StepGeneralComponent, ReactiveFormsModule],
      providers: [{ provide: StateService, useValue: stateSvcStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(StepGeneralComponent);
    component = fixture.componentInstance;

    const formGroup = new FormGroup({
      productName: new FormControl('', Validators.required),
      az: new FormControl('', Validators.required),
    });
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the AZ select when showAz is true', () => {
    const select = fixture.nativeElement.querySelector('mat-select');
    expect(select).toBeTruthy();
  });

  it('should hide the AZ select when showAz is false', () => {
    fixture.componentRef.setInput('showAz', false);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('mat-select');
    expect(select).toBeFalsy();
  });

  it('should auto-select AZ when only one option is available', () => {
    azListSignal.set([{ code: 'az-only', name: 'Only Zone', logoUrl: 'https://cdn.example.com/az-only.svg' }]);
    fixture.detectChanges();

    const azControl = component.formGroup().get('az');
    expect(azControl!.value).toBe('az-only');
  });

  it('should not auto-select AZ when multiple options are available', () => {
    azListSignal.set(mockAzList);
    fixture.detectChanges();

    const azControl = component.formGroup().get('az');
    expect(azControl!.value).toBe('');
  });
});
