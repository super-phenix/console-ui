import { AZ, Product } from './product.model';

describe('Product Model', () => {
  describe('AZ interface', () => {
    it('should have a logoUrl property', () => {
      const az: AZ = {
        code: 'az1',
        name: 'Availability Zone 1',
        logoUrl: 'https://cdn.example.com/az-icons/az1-icon.svg',
      };

      expect(az.logoUrl).toBe('https://cdn.example.com/az-icons/az1-icon.svg');
      expect(az.code).toBe('az1');
      expect(az.name).toBe('Availability Zone 1');
    });

    it('should support different logo URL formats', () => {
      const az: AZ = {
        code: 'az2',
        name: 'Availability Zone 2',
        logoUrl: '/api/v1/az/az2/logo',
      };

      expect(az.logoUrl).toBe('/api/v1/az/az2/logo');
    });
  });

  describe('Product class', () => {
    it('should have codeAZ property', () => {
      const product = new Product();
      product.id = '1';
      product.eid = 'eid-1';
      product.productName = 'Test Product';
      product.codeAZ = 'az1';
      product.gitops = 'false';

      expect(product.codeAZ).toBe('az1');
    });

    it('should allow codeAZ to be undefined', () => {
      const product = new Product();
      product.id = '2';
      product.eid = 'eid-2';
      product.productName = 'Test Product 2';
      product.gitops = '';

      expect(product.codeAZ).toBeUndefined();
    });
  });
});
