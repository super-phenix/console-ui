import { InstanceSnapshot, InstanceSnapshotContent } from './compute/instance-snapshot/instance-snapshot.model';
import { VirtualMachine } from './compute/instance/vm.model';
import { VirtualMachineInstance } from './compute/instance/vmi.model';
import { DNAT, EIP, FIP, SNAT } from './network/eip/eip.model';
import { Firewall } from './network/firewall/firewall.model';
import { LoadBalancer } from './network/load-balancer/load-balancer.model';
import { NatGateway, Subnet } from './network/subnet/subnet.model';
import { VPC } from './network/vpc/vpc.model';
import { Cluster } from './paas/kaas/cluster.model';
import { BaaS } from './storage/baas/baas.model';
import { BucketView } from './storage/bucket/bucket.model';
import { Disk, MountStatus } from './storage/disk/disk.model';
import { PVC } from './storage/disk/pvc.model';
import { Snapshot, SnapshotSchedule } from './storage/snapshot/snapshot.model';
import { SSH } from './uncategorized/ssh/ssh.model';

export const ProductNameLabel = 'superphenix.net/productName';
export const ProductGitOpsLabel = 'superphenix.net/gitops';

export interface ArgoCdLink {
  link: string;
}

export interface AZ {
  code: string;
  name: string;
  logoUrl: string;
}

export class Product {
  id!: string;
  eid!: string;
  productName!: string;
  codeAZ?: string;
  productTypeId?: string;
  gitops!: 'true' | 'false' | '';
}

export class ProductCreation {
  eid!: string;
}

export interface ProductInstance extends Product {
  vm?: VirtualMachine;
  vmi?: VirtualMachineInstance;
  cloudInit?: string;
  containerDisks?: string[];
}

export interface ProductInstanceSnapshot extends Product {
  vmSnapshot?: InstanceSnapshot;
  vmSnapshotContent?: InstanceSnapshotContent;
}

export interface ProductVPC extends Product {
  vpc?: VPC;
}

export interface ProductSubnet extends Product {
  subnet?: Subnet;
  natGateway?: NatGateway;
}

export interface ProductEIP extends Product {
  eip?: EIP;
  fip?: FIP;
  snat?: SNAT[];
  dnat?: DNAT[];
}

export interface ProductDisk extends Product {
  disk?: Disk;
  pvc: PVC;
  mountStatus?: MountStatus;
}

export interface ProductSnapshot extends Product {
  snapshot?: Snapshot;
  snapshotSchedule?: SnapshotSchedule;
}

export interface ProductSSH extends Product {
  ssh?: SSH;
}

export interface ProductLoadBalancer extends Product {
  loadBalancer?: LoadBalancer;
}

export interface ProductFirewall extends Product {
  firewall?: Firewall;
}

export interface ProductKaaS extends Product {
  cluster?: Cluster;
}

export interface ProductBaaS extends Product {
  backup?: BaaS;
}

export interface ProductBucket extends Product {
  bucket?: BucketView;
}
