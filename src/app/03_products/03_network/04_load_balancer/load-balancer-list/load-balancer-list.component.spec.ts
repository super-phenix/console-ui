import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadBalancerListComponent } from './load-balancer-list.component';

describe('LoadBalancerListComponent', () => {
  let component: LoadBalancerListComponent;
  let fixture: ComponentFixture<LoadBalancerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadBalancerListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadBalancerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
