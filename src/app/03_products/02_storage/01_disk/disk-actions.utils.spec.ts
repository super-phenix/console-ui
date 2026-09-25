import { Router, UrlTree } from '@angular/router';
import { ProductDisk } from '@products/00_shared/models/product.model';
import { DiskActions, redirectToParentKaas } from './disk-actions.utils';
import { v5 as uuidv5 } from 'uuid';

describe('DiskActions', () => {
  describe('redirectToParentKaas', () => {
    let mockRouter: jasmine.SpyObj<Router>;

    beforeEach(() => {
      mockRouter = jasmine.createSpyObj<Router>('Router', ['createUrlTree', 'serializeUrl']);
      mockRouter.createUrlTree.and.callFake((commands: unknown[]) => commands as unknown as UrlTree);
      mockRouter.serializeUrl.and.callFake((urlTree: UrlTree) => (urlTree as unknown as string[]).join('/'));
      spyOn(window, 'open');
    });

    it('should extract uuid from localId and compute effectiveId using uuidv5 with projectId from disk labels', () => {
      const clusterUuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      const projectId = 'e82b7936-cb8c-4a37-b648-8df04e8aa153';
      const az = 'fr-par-1';

      const disk: ProductDisk = {
        id: 'disk-1',
        eid: 'disk-1',
        productName: 'cluster-disk',
        gitops: '',
        disk: {
          metadata: {
            name: 'cluster-disk',
            labels: {
              'superphenix.net/resourceLocalID': `${clusterUuid}-pvc-0`,
              'superphenix.net/projectID': `spx-${projectId}`,
            },
          },
        } as unknown as ProductDisk['disk'],
      };

      const expectedEffectiveId = 'spx-' + uuidv5(clusterUuid, projectId);

      redirectToParentKaas(mockRouter, az, disk);

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith([
        '/products',
        'paas',
        'kaas',
        'details',
        az,
        expectedEffectiveId,
      ]);
      expect(window.open).toHaveBeenCalledWith(`/products/paas/kaas/details/${az}/${expectedEffectiveId}`, '_blank');
    });

    it('should extract uuid and projectId from pvc labels when disk labels are absent', () => {
      const clusterUuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      const projectId = 'e82b7936-cb8c-4a37-b648-8df04e8aa153';
      const az = 'fr-par-1';

      const disk: ProductDisk = {
        id: 'disk-2',
        eid: 'disk-2',
        productName: 'pvc-disk',
        gitops: '',
        pvc: {
          metadata: {
            name: 'pvc-disk',
            labels: {
              'superphenix.net/resourceLocalID': `${clusterUuid}-data`,
              'superphenix.net/projectID': `spx-${projectId}`,
            },
          },
        } as unknown as ProductDisk['pvc'],
      };

      const expectedEffectiveId = 'spx-' + uuidv5(clusterUuid, projectId);

      redirectToParentKaas(mockRouter, az, disk);

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith([
        '/products',
        'paas',
        'kaas',
        'details',
        az,
        expectedEffectiveId,
      ]);
      expect(window.open).toHaveBeenCalledWith(`/products/paas/kaas/details/${az}/${expectedEffectiveId}`, '_blank');
    });

    it('should do nothing if az is undefined', () => {
      const disk: ProductDisk = {
        id: 'disk-1',
        eid: 'disk-1',
        productName: 'cluster-disk',
        gitops: '',
        disk: {
          metadata: {
            name: 'cluster-disk',
            labels: {
              'superphenix.net/resourceLocalID': '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
              'superphenix.net/projectID': 'spx-e82b7936-cb8c-4a37-b648-8df04e8aa153',
            },
          },
        } as unknown as ProductDisk['disk'],
      };

      redirectToParentKaas(mockRouter, undefined, disk);

      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should do nothing if resourceLocalID label is missing', () => {
      const disk: ProductDisk = {
        id: 'disk-3',
        eid: 'disk-3',
        productName: 'disk-no-local-id',
        gitops: '',
        disk: {
          metadata: {
            name: 'disk-no-local-id',
            labels: {
              'superphenix.net/projectID': 'spx-e82b7936-cb8c-4a37-b648-8df04e8aa153',
            },
          },
        } as unknown as ProductDisk['disk'],
      };

      redirectToParentKaas(mockRouter, 'fr-par-1', disk);

      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should do nothing if resourceLocalID does not start with a valid uuid', () => {
      const disk: ProductDisk = {
        id: 'disk-4',
        eid: 'disk-4',
        productName: 'disk-invalid-uuid',
        gitops: '',
        disk: {
          metadata: {
            name: 'disk-invalid-uuid',
            labels: {
              'superphenix.net/resourceLocalID': 'not-a-valid-uuid',
              'superphenix.net/projectID': 'spx-e82b7936-cb8c-4a37-b648-8df04e8aa153',
            },
          },
        } as unknown as ProductDisk['disk'],
      };

      redirectToParentKaas(mockRouter, 'fr-par-1', disk);

      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should do nothing if projectId is missing in labels', () => {
      const disk: ProductDisk = {
        id: 'disk-5',
        eid: 'disk-5',
        productName: 'disk-no-proj-id',
        gitops: '',
        disk: {
          metadata: {
            name: 'disk-no-proj-id',
            labels: {
              'superphenix.net/resourceLocalID': '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            },
          },
        } as unknown as ProductDisk['disk'],
      };

      redirectToParentKaas(mockRouter, 'fr-par-1', disk);

      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should be callable via DiskActions.redirectToParentKaas static alias', () => {
      expect(DiskActions.redirectToParentKaas).toBe(redirectToParentKaas);
    });
  });
});
