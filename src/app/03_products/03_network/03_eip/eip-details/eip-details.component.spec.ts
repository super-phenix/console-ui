import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EipDetailsComponent } from './eip-details.component';

describe('EipDetailsComponent', () => {
  let component: EipDetailsComponent;
  let fixture: ComponentFixture<EipDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EipDetailsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EipDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
