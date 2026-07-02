import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchExpressionComponent } from './match-expression.component';

describe('MatchExpressionComponent', () => {
  let component: MatchExpressionComponent;
  let fixture: ComponentFixture<MatchExpressionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchExpressionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchExpressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
