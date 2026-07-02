import { TestBed } from '@angular/core/testing';

import { VPCService } from './vpc.service';

describe('VPCService', () => {
  let service: VPCService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VPCService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
