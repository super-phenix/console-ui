interface ProductCategory {
  title: string; // Title of the category
  baseLink: string; // base path for redirect to category
  icon: string; // icon to show in sidenav
  items: ProductItem[];
}

interface ProductItem {
  link: string;
  icon?: string;
  title: string;
}

export const ProductCompute: ProductCategory = {
  title: 'Compute',
  baseLink: 'compute',
  icon: 'memory',
  items: [
    {
      link: 'instance',
      title: 'Instance',
    },
    {
      link: 'instance-snapshot',
      title: 'Instance Snapshot',
    },
  ],
};

export const ProductStorage: ProductCategory = {
  title: 'Storage',
  baseLink: 'storage',
  icon: 'hard_drive',
  items: [
    {
      link: 'disk',
      title: 'Disk',
    },
    {
      link: 'snapshot',
      title: 'Snapshot',
    },
    {
      link: 'baas',
      title: 'Backup',
    },
    {
      link: 'bucket',
      title: 'Object Storage',
    },
  ],
};

export const ProductNetwork: ProductCategory = {
  title: 'Network',
  baseLink: 'network',
  icon: 'lan',
  items: [
    {
      link: 'vpc',
      title: 'VPC',
    },
    {
      link: 'subnet',
      title: 'Subnet',
    },
    {
      link: 'eip',
      title: 'EIP',
    },
    {
      link: 'load-balancer',
      title: 'Load Balancer',
    },
    {
      link: 'firewall',
      title: 'Firewall',
    },
  ],
};

export const ProductPaas: ProductCategory = {
  title: 'PaaS',
  baseLink: 'paas',
  icon: 'backup',
  items: [
    {
      link: 'kaas',
      title: 'Kubernetes',
    },
  ],
};

export const ProductUncategorized: ProductCategory = {
  title: '',
  baseLink: 'uncategorized',
  icon: '',
  items: [
    {
      link: 'ssh',
      icon: 'key',
      title: 'SSH Keys',
    },
  ],
};

export const ProductList = [ProductCompute, ProductStorage, ProductNetwork, ProductPaas, ProductUncategorized];

export const ProductTypeLink: Map<string, string> = new Map<string, string>([
  ['instance', 'instance'],
  ['vpc', 'vpc'],
  ['subnet', 'subnet'],
  ['eip', 'eip'],
  ['disk', 'disk'],
  ['snapshot', 'snapshot'],
  ['vmSnapshot', 'instance-snapshot'],
  ['loadBalancer', 'load-balancer'],
  ['firewall', 'firewall'],
  ['kaas', 'kaas'],
  ['bucket', 'bucket'],
  ['ssh', 'ssh'],
]);

export function getProduct(type: string) {
  let path = '';
  const typeLink = ProductTypeLink.get(type) || type;
  ProductList.forEach(product => {
    const item = product.items.find(v => v.link === typeLink);
    if (item) {
      path = product.baseLink + '/' + item?.link;
    }
  });
  return path;
}
