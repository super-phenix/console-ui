import { Router, UrlTree } from '@angular/router';
import { ProductSecurityGroup } from '@products/00_shared/models/product.model';
import { SecurityGroup } from '@products/00_shared/models/network/security-group/security-group.model';
import { redirectToParentKaas, SecurityGroupActions } from './security-group-actions.utils';

describe('SecurityGroupActions', () => {
  describe('redirectToParentKaas', () => {
    let mockRouter: jasmine.SpyObj<Router>;

    beforeEach(() => {
      mockRouter = jasmine.createSpyObj<Router>('Router', ['createUrlTree', 'serializeUrl']);
      mockRouter.createUrlTree.and.callFake((commands: unknown[]) => commands as unknown as UrlTree);
      mockRouter.serializeUrl.and.callFake((urlTree: UrlTree) => (urlTree as unknown as string[]).join('/'));
      spyOn(window, 'open');
    });

    it('should retrieve effectiveId directly from resourceEffectiveID label', () => {
      const clusterEffectiveId = 'spx-6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      const az = 'fr-par-1';

      const sg: ProductSecurityGroup = {
        id: 'sg-1',
        eid: 'sg-1',
        productName: 'cluster-sg',
        gitops: '',
        securityGroup: {
          metadata: {
            name: 'cluster-sg',
            labels: {
              'superphenix.net/resourceEffectiveID': clusterEffectiveId,
            },
          },
        } as unknown as SecurityGroup,
      };

      redirectToParentKaas(mockRouter, az, sg);

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith([
        '/products',
        'paas',
        'kaas',
        'details',
        az,
        clusterEffectiveId,
      ]);
      expect(window.open).toHaveBeenCalledWith(`/products/paas/kaas/details/${az}/${clusterEffectiveId}`, '_blank');
    });

    it('should retrieve effectiveId directly from resourceEffectiveId label when camelCased', () => {
      const clusterEffectiveId = 'spx-12345678-abcd-1234-abcd-1234567890ab';
      const az = 'fr-par-2';

      const sg: ProductSecurityGroup = {
        id: 'sg-alt',
        eid: 'sg-alt',
        productName: 'cluster-sg-alt',
        gitops: '',
        securityGroup: {
          metadata: {
            name: 'cluster-sg-alt',
            labels: {
              'superphenix.net/resourceEffectiveId': clusterEffectiveId,
            },
          },
        } as unknown as SecurityGroup,
      };

      redirectToParentKaas(mockRouter, az, sg);

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith([
        '/products',
        'paas',
        'kaas',
        'details',
        az,
        clusterEffectiveId,
      ]);
      expect(window.open).toHaveBeenCalledWith(`/products/paas/kaas/details/${az}/${clusterEffectiveId}`, '_blank');
    });

    it('should do nothing if az is undefined', () => {
      const sg: ProductSecurityGroup = {
        id: 'sg-1',
        eid: 'sg-1',
        productName: 'cluster-sg',
        gitops: '',
        securityGroup: {
          metadata: {
            name: 'cluster-sg',
            labels: {
              'superphenix.net/resourceEffectiveID': 'spx-6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            },
          },
        } as unknown as SecurityGroup,
      };

      redirectToParentKaas(mockRouter, undefined, sg);

      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should do nothing if securityGroup is undefined', () => {
      const sg: ProductSecurityGroup = {
        id: 'sg-1',
        eid: 'sg-1',
        productName: 'no-sg',
        gitops: '',
      };

      redirectToParentKaas(mockRouter, 'fr-par-1', sg);

      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should do nothing if resourceEffectiveId label is missing', () => {
      const sg: ProductSecurityGroup = {
        id: 'sg-2',
        eid: 'sg-2',
        productName: 'sg-no-effective-id',
        gitops: '',
        securityGroup: {
          metadata: {
            name: 'sg-no-effective-id',
            labels: {
              'superphenix.net/projectID': 'spx-e82b7936-cb8c-4a37-b648-8df04e8aa153',
            },
          },
        } as unknown as SecurityGroup,
      };

      redirectToParentKaas(mockRouter, 'fr-par-1', sg);

      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should be callable via SecurityGroupActions.redirectToParentKaas static alias', () => {
      expect(SecurityGroupActions.redirectToParentKaas).toBe(redirectToParentKaas);
    });
  });
});
