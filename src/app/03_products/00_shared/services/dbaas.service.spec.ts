import { TestBed } from '@angular/core/testing';

import { DBaaSService } from './dbaas.service';

describe('DBaaSService', () => {
  let service: DBaaSService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DBaaSService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
