import { CreateDisk } from '../../storage/disk/create-disk.model';
import { AdvancedOptionsInput } from './advanced-options.model';
import { RunStrategy } from './enums/run-strategy.enum';

export type CpuValue = 1 | 2 | 4 | 8 | 16 | 32;
export const CPU_VALUE_LIST: CpuValue[] = [1, 2, 4, 8, 16, 32];
export const CPU_DEFAULT_VALUE = 1;
export type MemoryValue = 1 | 2 | 4 | 8 | 16 | 32 | 64;
export const MEMORY_VALUE_LIST: MemoryValue[] = [1, 2, 4, 8, 16, 32, 64];
export const MEMORY_DEFAULT_VALUE = 1;

export const VM_TYPE_DEFAULT = 'linux';

// BUS type for disk and cloud init
export const BUS_AUTO = 'auto';
export const BUS_SATA = 'sata';
export const BUS_VIRTIO = 'virtio';
export const BUS_LIST = [BUS_AUTO, BUS_SATA, BUS_VIRTIO];

// Network model for instance interface
export const NETWORK_MODEL_AUTO = 'auto';
export const NETWORK_MODEL_E1000 = 'e1000';
export const NETWORK_MODEL_VIRTIO = 'virtio';
export const NETWORK_MODEL_LIST = [NETWORK_MODEL_AUTO, NETWORK_MODEL_E1000, NETWORK_MODEL_VIRTIO];

export const DEFAULT_CLOUD_INIT = `#cloud-config
ssh_pwauth: true
users:
  - name: spx
    groups: sudo
    sudo: ['ALL=(ALL) NOPASSWD:ALL']
    shell: /bin/bash
chpasswd:
  expire: true
  users:
    - {name: spx, password: "<generated_password>", type: text}
write_files:
  - path: /etc/systemd/resolved.conf.d/dns_servers.conf
    content: |
      [Resolve]
      DNS=1.1.1.1 1.0.0.1
    permissions: '0644'
runcmd:
  - systemctl restart systemd-resolved
`;

export class CreateInstance {
  constructor(init: Partial<CreateInstance>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];
  }

  general!: {
    productName: string;
    runStrategy: RunStrategy;
    vmType: string;
    labels?: string[];
  };
  compute!: {
    cpu: CpuValue;
    memory: MemoryValue;
  };
  network!: CreateInstanceNetwork[] | null;
  disks?: CreateInstanceDisk[] | null;
  cloudInit?: CreateInstanceCloudInit;
  sshKeys?: string[];
  containerDisks?: string[];
  // Optional advanced device/firmware overrides; omit to push no override.
  advanced?: AdvancedOptionsInput;
}

export class UpdateInstance {
  general!: {
    productName: string;
    runStrategy: RunStrategy;
    vmType: string;
    labels?: string[];
  };
  compute!: {
    cpu: CpuValue;
    memory: MemoryValue;
  };
  network!: CreateInstanceNetwork[] | null;
  disks?: CreateInstanceDisk[] | null;
  cloudInit?: CreateInstanceCloudInit;
  sshKeys?: string[];
  containerDisks?: string[];
  // Optional advanced device/firmware overrides; omit to leave them untouched.
  advanced?: AdvancedOptionsInput;
}

export interface CreateInstanceCloudInit {
  custom: boolean;
  config?: string;
  bus?: string;
}

export interface CreateInstanceNetwork {
  order: number;
  subnetEId: string; //subnet Effective ID
  model?: string;
  ipv4?: string;
  ipv6?: string;
}

export interface CreateInstanceDisk {
  order: number;
  cdrom: boolean;
  eid?: string;
  disk?: CreateDisk;
  bus?: string;
}

export interface CreateInstanceSsh {
  name: string;
  eid: string;
}
