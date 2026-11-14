import { Condition } from '../../common.model';
import { Product } from '../../product.model';

// Sizing options accepted by the API (argo-app/dbaas/consts.go), not display labels.
export const DBAAS_CPU_LIST = [1, 2, 4, 8, 16] as const;
export type DBaaSCpu = (typeof DBAAS_CPU_LIST)[number];
export const DBAAS_MEMORY_LIST = [1, 2, 4, 8, 16, 32, 64] as const;
export type DBaaSMemory = (typeof DBAAS_MEMORY_LIST)[number];
export const DBAAS_MIN_INSTANCES = 1;
export const DBAAS_MAX_INSTANCES = 5;

export const DBAAS_DEFAULT_CPU: DBaaSCpu = 1;
export const DBAAS_DEFAULT_MEMORY: DBaaSMemory = 2;
export const DBAAS_DEFAULT_INSTANCES = 1;
export const DBAAS_DEFAULT_STORAGE = 10;

// CNPG service roles: rw targets the primary, ro the replicas only, r any instance.
export type DBaaSEndpointRole = 'rw' | 'ro' | 'r';

// Where a client connects from: the database subnet, or the internet through the Elastic IP.
export type DBaaSNetwork = 'private' | 'public';

export interface DBaaSEndpoint {
  role?: DBaaSEndpointRole;
  host: string;
  port: number;
  // True when host is the Elastic IP of the database instead of the load balancer VIP
  external?: boolean;
}

export interface DBaaSCredentials {
  username: string;
  password: string;
  dbname: string;
  endpoints: DBaaSEndpoint[];
}

interface ResourceList {
  cpu?: string;
  memory?: string;
}

// Trimmed view of a CNPG Cluster returned by the AZ controller (view/dbaas.go)
export interface PostgresCluster {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
  };
  spec: {
    instances?: number;
    imageName?: string;
    storage?: {
      size?: string;
      storageClass?: string;
    };
    resources?: {
      requests?: ResourceList;
      limits?: ResourceList;
    };
    postgresql?: {
      parameters?: Record<string, string>;
    };
  };
  status: {
    phase?: string;
    phaseReason?: string;
    instances?: number;
    readyInstances?: number;
    currentPrimary?: string;
    image?: string;
    conditions?: Condition[];
  };
}

export interface DBaaSSpec {
  version: string;
  instances: number;
  cpu: number;
  memory: number;
  storage: number;
  storageClass: string;
  subnetEId: string;
  vip: string;
  externalAccess: boolean;
}

export class CreateDBaaS {
  constructor(init: Partial<CreateDBaaS>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];
  }

  general!: {
    productName: string;
  };
  spec!: DBaaSSpec;
}

// Update uses the create body; storageClass, subnetEId and vip are immutable and sent unchanged.
export type UpdateDBaaS = CreateDBaaS;

export interface UpdateDBaaSProduct extends Product {
  spec: DBaaSSpec;
}

// "ghcr.io/cloudnative-pg/postgresql:17.11" -> "17.11"
export function postgresVersionFromImage(image?: string): string | undefined {
  if (!image) {
    return undefined;
  }
  const idx = image.lastIndexOf(':');
  return idx >= 0 ? image.slice(idx + 1) : undefined;
}

export function postgresMajor(version: string): string {
  return version.split('.')[0];
}
