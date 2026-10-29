import { AbstractControl, ValidatorFn, Validators } from '@angular/forms';
import { BinaryUnit, BYTES_PER_MIB, parseQuantityToBytes } from '@products/00_shared/utils/quantity';
import { CreateDisk } from '../../storage/disk/create-disk.model';
import { AdvancedOptionsInput } from './advanced-options.model';
import { RunStrategy } from './enums/run-strategy.enum';

export type CpuValue = number;
export const CPU_MIN = 1;
export const CPU_MAX = 999999;
export const CPU_PRESET_LIST: CpuValue[] = [1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64];
export const CPU_DEFAULT_VALUE = 1;
export const CPU_VALIDATORS = [
  Validators.required,
  Validators.pattern(/^\d+$/),
  Validators.min(CPU_MIN),
  Validators.max(CPU_MAX),
];
// Memory is a Kubernetes binary quantity ("4Gi", "1536Mi").
export type MemoryValue = string;
export const MEMORY_MIN = '128Mi';
export const MEMORY_MAX = '999999Gi';
// Presets in GiB.
export const MEMORY_PRESET_LIST: number[] = [1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256];
export const MEMORY_DEFAULT_VALUE: MemoryValue = '4Gi';
export const MEMORY_UNITS: BinaryUnit[] = ['Mi', 'Gi', 'Ti'];

// Accepts a whole number of MiB between MEMORY_MIN and MEMORY_MAX; empty values are left to required.
export const memoryQuantityValidator: ValidatorFn = (control: AbstractControl<MemoryValue | null>) => {
  if (!control.value) {
    return null;
  }
  const bytes = parseQuantityToBytes(control.value);
  const valid =
    bytes !== null &&
    Number.isInteger(bytes / BYTES_PER_MIB) &&
    bytes >= parseQuantityToBytes(MEMORY_MIN)! &&
    bytes <= parseQuantityToBytes(MEMORY_MAX)!;
  return valid ? null : { memoryQuantity: true };
};
export const MEMORY_VALIDATORS = [Validators.required, memoryQuantityValidator];

// Presets and bounds for a compute size field; bounds are enforced by the matching validators.
export interface ComputeSize {
  presets: number[];
  min: number;
  max: number;
}
export const CPU_SIZE: ComputeSize = { presets: CPU_PRESET_LIST, min: CPU_MIN, max: CPU_MAX };

export const VM_TYPE_DEFAULT = 'linux';

// BUS type for disk and cloud init
export type BusValue = 'auto' | 'sata' | 'virtio';

export interface BusOption {
  value: BusValue;
  name: string;
}

export const BUS_AUTO: BusOption = { value: 'auto', name: 'Auto' };
export const BUS_SATA: BusOption = { value: 'sata', name: 'SATA' };
export const BUS_VIRTIO: BusOption = { value: 'virtio', name: 'VirtIO' };
export const BUS_LIST: BusOption[] = [BUS_AUTO, BUS_SATA, BUS_VIRTIO];

export function getBusName(value?: string | null): string {
  const found = BUS_LIST.find(b => b.value === value);
  return found ? found.name : (value ?? '');
}

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

/**
 * GpuClass is a passthrough GPU type, as declared in the AZ controller's deviceMapping.
 * Returned by GET …/gpu-class and in ProductInstance.gpus. The KubeVirt device name stays server-side.
 */
export interface GpuClass {
  id: string;
  displayName: string;
}

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
    // Passthrough GPUs by class (at most 1). Omit or [] for no GPU; on update, omit to keep the current ones.
    gpu?: { device: string }[];
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
    // Passthrough GPUs by class (at most 1). Omit or [] for no GPU; on update, omit to keep the current ones.
    gpu?: { device: string }[];
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
  enabled?: boolean;
  ipv4?: string;
  ipv6?: string;
  macAddress?: string;
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
