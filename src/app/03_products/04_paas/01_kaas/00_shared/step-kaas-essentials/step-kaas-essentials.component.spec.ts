import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepKaasEssentialsComponent } from './step-kaas-essentials.component';

describe('StepKaasEssentialsComponent', () => {
  let component: StepKaasEssentialsComponent;
  let fixture: ComponentFixture<StepKaasEssentialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepKaasEssentialsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepKaasEssentialsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
