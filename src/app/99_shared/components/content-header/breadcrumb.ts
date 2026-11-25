import { ProductList } from '@shared/models/data/product.enum';

export interface BreadcrumbCrumb {
  label: string;
  icon?: string;
  link?: string[];
}

export interface BreadcrumbResource {
  name?: string | null;
  id?: string | null;
}

const ACTION_LABEL: Record<string, string> = {
  create: 'Create',
  details: 'Details',
  update: 'Edit',
};

/**
 * Name of the loaded resource, or its id when that resource has no name.
 * An id from the route is not used: showing it before the resource arrives
 * flashes the id and then the name.
 */
export function resourceCrumbLabel(resource: BreadcrumbResource | undefined): string {
  const name = resource?.name?.trim();
  if (name) {
    return name;
  }
  return resource?.id?.trim() ?? '';
}

/** Trail for `/products/{category}/{item}` pages. Empty outside product routes. */
export function buildBreadcrumbs(
  url: string,
  pageTitle?: string,
  resource?: BreadcrumbResource,
): BreadcrumbCrumb[] {
  const path = url.split(/[?#]/)[0].replace(/\/+$/, '');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] !== 'products' || parts.length < 3) {
    return [];
  }

  const category = ProductList.find(product => product.baseLink === parts[1]);
  const item = category?.items.find(entry => entry.link === parts[2]);
  if (!category || !item) {
    return [];
  }

  const listLink = ['/products', category.baseLink, item.link];
  const deeper = parts.length > 3;
  const crumbs: BreadcrumbCrumb[] = [];

  if (category.title) {
    const home = category.items[0];
    crumbs.push({
      label: category.title,
      icon: category.icon || undefined,
      link: home ? ['/products', category.baseLink, home.link] : undefined,
    });
  }

  const product: BreadcrumbCrumb = { label: item.title };
  if (!category.title && item.icon) {
    product.icon = item.icon;
  }
  if (deeper) {
    product.link = listLink;
  }
  crumbs.push(product);

  if (!deeper) {
    return crumbs;
  }

  if (parts[3] === 'details' || parts[3] === 'update') {
    const leaf = resourceCrumbLabel(resource);
    if (leaf) {
      crumbs.push({ label: leaf });
    }
    return crumbs;
  }

  const leaf = pageTitle?.trim() || ACTION_LABEL[parts[3]] || parts[3];
  if (leaf.toLowerCase() === item.title.toLowerCase()) {
    delete crumbs[crumbs.length - 1].link;
    return crumbs;
  }

  crumbs.push({ label: leaf });
  return crumbs;
}
