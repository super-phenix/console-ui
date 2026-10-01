import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CONTROLLER_PATH, HTTP_PROTOCOL, environment } from '@env/environment';

import { KaasService } from './kaas.service';

describe('KaasService', () => {
  let service: KaasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(KaasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getKubeVersions', () => {
    it('should request the versions of the AZ', () => {
      let versions: string[] | undefined;
      service.getKubeVersions('org1', 'proj1', 'az1').subscribe(v => (versions = v));

      const req = httpMock.expectOne(
        `${HTTP_PROTOCOL}${environment.apiUrl}/org1${CONTROLLER_PATH}/az1/proj1/kaas/kube-versions`
      );
      expect(req.request.method).toBe('GET');
      req.flush(['v1.36.3', 'v1.35.5']);

      expect(versions).toEqual(['v1.36.3', 'v1.35.5']);
    });

    it('should propagate the error when the AZ has no KaaS configuration', () => {
      let versions: string[] | undefined;
      let status: number | undefined;
      service
        .getKubeVersions('org1', 'proj1', 'az1')
        .subscribe({ next: v => (versions = v), error: (err: HttpErrorResponse) => (status = err.status) });

      httpMock
        .expectOne(`${HTTP_PROTOCOL}${environment.apiUrl}/org1${CONTROLLER_PATH}/az1/proj1/kaas/kube-versions`)
        .flush(
          { message: 'No KaaS configuration for this AZ version', context: { az: 'az1', spxVersion: '0.6.3' } },
          { status: 409, statusText: 'Conflict' }
        );

      expect(versions).toBeUndefined();
      expect(status).toBe(409);
    });
  });
});
