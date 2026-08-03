import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';

import { UpdateDisk } from '../models/storage/disk/create-disk.model';
import { DiskService } from './disk.service';

describe('DiskService', () => {
  const orgaId = 'org1';
  const projectId = 'proj1';
  const az = 'az1';
  const eid = 'eid1';
  const url = `${environment.url.http}/${orgaId}${environment.api.controller}/${az}/${projectId}/disk/${eid}`;

  const updateDisk: UpdateDisk = {
    general: {
      productName: 'my-disk',
      labels: [],
      storage: '20',
    },
  };

  let service: DiskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DiskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('update', () => {
    it('should send force=true when forced', () => {
      service.update(orgaId, projectId, az, eid, updateDisk, true).subscribe();

      const req = httpMock.expectOne(r => r.url === url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(updateDisk);
      expect(req.request.params.get('force')).toBe('true');
      expect(req.request.urlWithParams).toBe(`${url}?force=true`);

      req.flush({});
    });

    it('should not send any force param when not forced', () => {
      service.update(orgaId, projectId, az, eid, updateDisk, false).subscribe();

      const req = httpMock.expectOne(r => r.url === url);
      expect(req.request.params.has('force')).toBeFalse();
      expect(req.request.urlWithParams).toBe(url);

      req.flush({});
    });

    it('should not send any force param by default', () => {
      service.update(orgaId, projectId, az, eid, updateDisk).subscribe();

      const req = httpMock.expectOne(r => r.url === url);
      expect(req.request.params.has('force')).toBeFalse();
      expect(req.request.urlWithParams).toBe(url);

      req.flush({});
    });
  });
});
