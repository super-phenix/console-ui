import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadBalancerUpdateComponent } from './load-balancer-update.component';

describe('LoadBalancerUpdateComponent', () => {
  let component: LoadBalancerUpdateComponent;
  let fixture: ComponentFixture<LoadBalancerUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadBalancerUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadBalancerUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
