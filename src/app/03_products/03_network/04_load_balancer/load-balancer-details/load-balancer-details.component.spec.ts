import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LoadBalancerDetailsComponent } from './load-balancer-details.component';

describe('LoadBalancerDetailsComponent', () => {
  let component: LoadBalancerDetailsComponent;
  let fixture: ComponentFixture<LoadBalancerDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadBalancerDetailsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadBalancerDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
