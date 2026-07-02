import { TestBed } from '@angular/core/testing';

import { InstanceSnapshotService } from './instance-snapshot.service';

describe('InstanceSnapshotService', () => {
  let service: InstanceSnapshotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InstanceSnapshotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
