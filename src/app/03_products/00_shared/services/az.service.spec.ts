import { TestBed } from '@angular/core/testing';

import { AZ } from '../models/product.model';
import { AZService } from './az.service';

describe('AZService', () => {
  let service: AZService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AZService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
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
  });
});
