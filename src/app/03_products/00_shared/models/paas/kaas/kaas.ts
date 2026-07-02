import { CpuValue, MemoryValue } from '../../compute/instance/instance';
import { Product } from '../../product.model';

export const controlPlaneNetworkPolicies = ['default', 'none'] as const;
export type ControlPlaneNetworkPolicies = (typeof controlPlaneNetworkPolicies)[number];

export const workersNetworkPolicies = ['default', 'strict', 'none'] as const;
export type WorkersNetworkPolicies = (typeof workersNetworkPolicies)[number];

export class CreateKaaS {
  constructor(init: Partial<CreateKaaS>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];
  }

  general!: {
    productName: string;
    labels?: string[];
  };
  spec!: {
    kubeVersion: string;
    cpNetPol: ControlPlaneNetworkPolicies;
    workersNetPol: WorkersNetworkPolicies;
    groups: CreateKaasNodes[];
    postInstallChart?: KaasPostInstallChart;
    kaasEssentials?: CreateKaaSEssentials;
    controlPlane?: CreateKaasControlPlane;
  };
}

export class UpdateKaaSProduct extends Product {
  spec?: {
    kubeVersion: string;
    cpNetPol: ControlPlaneNetworkPolicies;
    workersNetPol: WorkersNetworkPolicies;
    groups: CreateKaasNodes[];
    postInstallChart?: KaasPostInstallChart;
    kaasEssentials?: CreateKaaSEssentials;
    controlPlane?: CreateKaasControlPlane;
  };
}

export class UpdateKaaS {
  general!: {
    productName: string;
    labels?: string[];
  };
  spec!: {
    kubeVersion: string;
    cpNetPol: ControlPlaneNetworkPolicies;
    workersNetPol: WorkersNetworkPolicies;
    groups: CreateKaasNodes[];
    postInstallChart?: KaasPostInstallChart;
    kaasEssentials?: CreateKaaSEssentials;
    controlPlane?: CreateKaasControlPlane;
  };
}

export interface CreateKaasControlPlane {
  dataStore: CreateKaasDataStore;
}

export interface CreateKaasDataStore {
  dedicated: boolean;
  storageClassName?: string;
  storage?: number; // GiB
}

export interface CreateKaasNodes {
  name: string;
  replicas: number;
  cpu: CpuValue;
  memory: MemoryValue;
  bootDiskSize: number;
  storageClass: string;
  subnets: CreateKaasNetwork[];
}

export interface CreateKaasNetwork {
  order: number;
  id: string; //subnet local ID
}

export interface CreateKaaSEssentials {
  corednsValues: string;
  ciliumValues: string;
  metricsServerValues: string;
}

export interface KaasPostInstallChart {
  chartName?: string;
  chartVersion?: string;
  namespace?: string;
  repoUrl?: string;
  revision?: number;
  values?: string;
}
