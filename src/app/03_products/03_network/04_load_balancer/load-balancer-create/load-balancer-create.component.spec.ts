import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadBalancerCreateComponent } from './load-balancer-create.component';

describe('LoadBalancerCreateComponent', () => {
  let component: LoadBalancerCreateComponent;
  let fixture: ComponentFixture<LoadBalancerCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadBalancerCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadBalancerCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
