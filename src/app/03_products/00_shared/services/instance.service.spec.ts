import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CONTROLLER_PATH, HTTP_PROTOCOL, environment } from '@env/environment';

import { GpuClass } from '../models/compute/instance/instance';
import { InstanceService } from './instance.service';

describe('InstanceService', () => {
  const orgaId = 'org1';
  const projectId = 'proj1';
  const az = 'az1';
  const basePath = `${HTTP_PROTOCOL}${environment.apiUrl}/${orgaId}${CONTROLLER_PATH}/${az}/${projectId}`;

  let service: InstanceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InstanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listGpuClasses', () => {
    it('should GET the gpu-class endpoint of the AZ', () => {
      const classes: GpuClass[] = [{ id: 'nvidia-rtx-pro-6000-bse', displayName: 'NVIDIA RTX PRO 6000' }];
      let result: GpuClass[] | undefined;

      service.listGpuClasses(orgaId, projectId, az).subscribe(r => (result = r));

      const req = httpMock.expectOne(`${basePath}/gpu-class`);
      expect(req.request.method).toBe('GET');
      req.flush(classes);
      expect(result).toEqual(classes);
    });

    it('should return an empty list when the AZ has no GPU', () => {
      let result: GpuClass[] | undefined;

      service.listGpuClasses(orgaId, projectId, az).subscribe(r => (result = r));

      httpMock.expectOne(`${basePath}/gpu-class`).flush([]);
      expect(result).toEqual([]);
    });
  });
});
