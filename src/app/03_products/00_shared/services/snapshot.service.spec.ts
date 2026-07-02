import { TestBed } from '@angular/core/testing';

import { SnapshotService } from './snapshot.service';

describe('SnapshotService', () => {
  let service: SnapshotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SnapshotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
