import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { VpcUpdateComponent } from './vpc-update.component';

describe('VpcUpdateComponent', () => {
  let component: VpcUpdateComponent;
  let fixture: ComponentFixture<VpcUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VpcUpdateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(VpcUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
