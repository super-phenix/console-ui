import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchLabelComponent } from './match-label.component';

describe('MatchLabelComponent', () => {
  let component: MatchLabelComponent;
  let fixture: ComponentFixture<MatchLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchLabelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
