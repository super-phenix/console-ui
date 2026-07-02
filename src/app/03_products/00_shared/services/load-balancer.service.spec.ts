import { TestBed } from '@angular/core/testing';

import { LoadBalancerService } from './load-balancer.service';

describe('LoadBalancerService', () => {
  let service: LoadBalancerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadBalancerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
