import { TestBed } from '@angular/core/testing';

import { SecurityGroupService } from './security-group.service';

describe('SecurityGroupService', () => {
  let service: SecurityGroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SecurityGroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
