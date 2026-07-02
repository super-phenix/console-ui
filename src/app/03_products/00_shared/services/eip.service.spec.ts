import { TestBed } from '@angular/core/testing';

import { EipService } from './eip.service';

describe('EipService', () => {
  let service: EipService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EipService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
