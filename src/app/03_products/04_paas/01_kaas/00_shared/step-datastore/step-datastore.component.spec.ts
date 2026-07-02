import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import { StepDataStoreComponent } from './step-datastore.component';

describe('StepDataStoreComponent', () => {
  let component: StepDataStoreComponent;
  let fixture: ComponentFixture<StepDataStoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepDataStoreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepDataStoreComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'formGroup',
      new FormGroup({
        storageClassName: new FormControl(''),
        storage: new FormControl(8),
      })
    );
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
