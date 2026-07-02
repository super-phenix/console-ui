import { TestBed } from '@angular/core/testing';

import { KaasService } from './kaas.service';

describe('KaasService', () => {
  let service: KaasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KaasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
