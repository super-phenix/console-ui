import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleDisplayComponent } from './rule-display.component';

describe('RuleDisplayComponent', () => {
  let component: RuleDisplayComponent;
  let fixture: ComponentFixture<RuleDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RuleDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
