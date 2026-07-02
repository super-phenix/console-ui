import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RulePortFormComponent } from './rule-port-form.component';

describe('RulePortFormComponent', () => {
  let component: RulePortFormComponent;
  let fixture: ComponentFixture<RulePortFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RulePortFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RulePortFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
