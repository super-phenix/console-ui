import { TestBed } from '@angular/core/testing';

import { FirewallService } from './firewall.service';

describe('FirewallService', () => {
  let service: FirewallService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirewallService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
