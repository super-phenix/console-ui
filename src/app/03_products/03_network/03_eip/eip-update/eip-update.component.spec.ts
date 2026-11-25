import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EipUpdateComponent } from './eip-update.component';

describe('EipUpdateComponent', () => {
  let component: EipUpdateComponent;
  let fixture: ComponentFixture<EipUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EipUpdateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EipUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
