import { buildBreadcrumbs } from './breadcrumb';

describe('buildBreadcrumbs', () => {
  it('builds a category and product trail for a list', () => {
    const crumbs = buildBreadcrumbs('/products/compute/instance');

    expect(crumbs.map(crumb => crumb.label)).toEqual(['Compute', 'Instance']);
    expect(crumbs[0].icon).toBe('memory');
    expect(crumbs[0].link).toEqual(['/products', 'compute', 'instance']);
    expect(crumbs[1].link).toBeUndefined();
  });

  it('uses the resource name on a details route, and the id when the name is missing', () => {
    const named = buildBreadcrumbs('/products/compute/instance/details/az-1/vm-1?tab=network', 'Instance details', {
      name: 'web-01',
      id: 'vm-1',
    });
    expect(named.map(crumb => crumb.label)).toEqual(['Compute', 'Instance', 'web-01']);
    expect(named[1].link).toEqual(['/products', 'compute', 'instance']);
    expect(named[2].link).toBeUndefined();

    const unnamed = buildBreadcrumbs('/products/compute/instance/update/az-1/vm-1', 'Edit an Instance', {
      name: '  ',
      id: 'vm-1',
    });
    expect(unnamed.map(crumb => crumb.label)).toEqual(['Compute', 'Instance', 'vm-1']);
  });

  it('waits for the resource instead of showing the id from the url', () => {
    const crumbs = buildBreadcrumbs('/products/compute/instance/details/az-1/vm-1', 'Instance details');

    expect(crumbs.map(crumb => crumb.label)).toEqual(['Compute', 'Instance']);
  });

  it('uses the catalog product name on a list whose page title differs', () => {
    const crumbs = buildBreadcrumbs('/products/storage/bucket', 'Buckets');

    expect(crumbs.map(crumb => crumb.label)).toEqual(['Storage', 'Object Storage']);
  });

  it('keeps uncategorized products to a single icon crumb', () => {
    const crumbs = buildBreadcrumbs('/products/uncategorized/ssh');

    expect(crumbs).toEqual([{ label: 'SSH Keys', icon: 'key' }]);
  });

  it('links an uncategorized product back to its list from a child page', () => {
    const crumbs = buildBreadcrumbs('/products/uncategorized/ssh/create', 'Create SSH Key');

    expect(crumbs[0].link).toEqual(['/products', 'uncategorized', 'ssh']);
    expect(crumbs[1]).toEqual({ label: 'Create SSH Key' });
  });

  it('returns nothing outside product routes', () => {
    expect(buildBreadcrumbs('/dashboard', 'Dashboard')).toEqual([]);
    expect(buildBreadcrumbs('/organization/settings', 'Organization Settings')).toEqual([]);
  });
});
