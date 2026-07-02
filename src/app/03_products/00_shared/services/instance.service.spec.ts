import { TestBed } from '@angular/core/testing';

import { InstanceService } from './instance.service';

describe('InstanceService', () => {
  let service: InstanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InstanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
