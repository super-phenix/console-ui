import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SKIP_ERROR_SNACKBAR } from '@shared/interceptor/errors.interceptor';

import { AZ } from '../models/product.model';
import { AZService } from './az.service';

describe('AZService', () => {
  let service: AZService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AZService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDefaultCloudInit', () => {
    it('should fetch the default cloud-init of the AZ', () => {
      const httpMock = TestBed.inject(HttpTestingController);
      let config: string | undefined;

      service.getDefaultCloudInit('org1', 'az1').subscribe(res => (config = res.config));

      const req = httpMock.expectOne(r => r.url.endsWith('/organization/org1/az/az1/default-cloud-init'));
      expect(req.request.method).toBe('GET');
      expect(req.request.context.get(SKIP_ERROR_SNACKBAR)).toBeTrue();
      req.flush({ config: '#cloud-config' });

      expect(config).toBe('#cloud-config');
      httpMock.verify();
    });
  });

  describe('getLogoUrl', () => {
    const azList: AZ[] = [
      { code: 'az1', name: 'Zone 1', logoUrl: 'https://cdn.example.com/az1.svg' },
      { code: 'az2', name: 'Zone 2', logoUrl: 'https://cdn.example.com/az2.svg' },
    ];

    it('should return the logo URL for a matching AZ code', () => {
      expect(AZService.getLogoUrl('az1', azList)).toBe('https://cdn.example.com/az1.svg');
      expect(AZService.getLogoUrl('az2', azList)).toBe('https://cdn.example.com/az2.svg');
    });

    it('should return an empty string when AZ code is not found', () => {
      expect(AZService.getLogoUrl('az99', azList)).toBe('');
    });

    it('should return an empty string when AZ code is undefined', () => {
      expect(AZService.getLogoUrl(undefined, azList)).toBe('');
    });

    it('should return an empty string when AZ list is empty', () => {
      expect(AZService.getLogoUrl('az1', [])).toBe('');
    });

    it('should return an empty string when AZ has no logoUrl', () => {
      const azListNoLogo: AZ[] = [{ code: 'az1', name: 'Zone 1' }];
      expect(AZService.getLogoUrl('az1', azListNoLogo)).toBe('');
    });
  });
});
