import { TestBed } from '@angular/core/testing';

import { SubnetService } from './subnet.service';

describe('SubnetService', () => {
  let service: SubnetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubnetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
