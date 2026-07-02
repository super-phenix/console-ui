import { Condition, ObjectMeta, Resources } from '../../common.model';

export interface VirtualMachineInstance {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: VirtualMachineInstanceSpec;
  status: Status;
}

export interface VirtualMachineInstanceSpec {
  domain: Domain;
  volumes: Volume[];
  architecture: string;
  hostname: string;
  networks: Network[];
  accessCredentials: AccessCredential[];
}

interface Domain {
  resources: Resources;
  cpu?: CurrentCPUTopology;
  memory?: Memory;
  machine?: Machine;
  devices: Devices;
}

interface CurrentCPUTopology {
  cores: number;
  sockets: number;
  threads: number;
  model?: string;
}

interface Machine {
  type: string;
}

interface Devices {
  disks: DiskElement[];
  interfaces: InterfaceElement[];
}

export interface DiskElement {
  name: string;
  disk?: DiskBus;
  cdrom?: CDRomBus;
}

export interface DiskBus {
  bus: string;
}

export interface CDRomBus {
  bus: string;
  readonly: boolean;
}

export interface InterfaceElement {
  model?: string;
  name: string;
}

export interface Volume {
  name: string;
  containerDisk?: ContainerDisk;
  persistentVolumeClaim?: PVC;
  dataVolume?: DataVolume;
  cloudInitNoCloud?: CloudInitNoCloud;
  cloudInitConfigDrive?: CloudInitConfigDrive;
}

interface CloudInitNoCloud {
  userData: string;
  userDataBase64: string;
  secretRef: {
    name: string;
  };
}

interface CloudInitConfigDrive {
  secretRef: {
    name: string;
  };
}

interface ContainerDisk {
  image: string;
  imagePullPolicy: string;
}

interface PVC {
  claimName: string;
}

interface DataVolume {
  name: string;
}

interface Status {
  nodeName: string;
  phase: string;
  conditions: Condition[];
  phaseTransitionTimestamps: PhaseTransitionTimestamp[];
  interfaces: VirtualMachineInstanceNetworkInterface[];
  volumeStatus: VolumeStatus[];
  currentCPUTopology: CurrentCPUTopology;
  memory: Memory;
}

interface Memory {
  guestCurrent: string;
  guest: string;
}

interface PhaseTransitionTimestamp {
  phase: string;
  phaseTransitionTimestamp: Date;
}

interface VolumeStatus {
  name: string;
  target: string;
  size?: number;
  containerDiskVolume?: ContainerDiskVolume;
}

interface ContainerDiskVolume {
  checksum: number;
}

interface Network {
  name: string;
  pod?: {
    vmNetworkCIDR?: string;
    vmIPv6NetworkCIDR?: string;
  };
  multus?: {
    networkName: string;
    default: boolean;
  };
}

interface VirtualMachineInstanceNetworkInterface {
  // Hardware address of a Virtual Machine interface
  mac?: string;
  // Name of the interface, corresponds to name of the network assigned to the interface
  name?: string;
  // List of all IP addresses of a Virtual Machine interface
  ipAddresses?: string[];
}

interface AccessCredential {
  sshPublicKey: {
    source: {
      secret: {
        secretName: string;
      };
    };
  };
}
