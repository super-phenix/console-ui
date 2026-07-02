import { Condition, ObjectMeta } from '../../common.model';

export interface EIP {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: EIPSpec;
  status: EIPStatus;
}

export interface FIP {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: FIPSpec;
  status: FIPStatus;
}

export interface SNAT {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: SNATSpec;
  status: SNATStatus;
  legacy?: boolean; // Property used to detect legacy SNAT
}

interface EIPSpec {
  v4ip: boolean;
  v6ip: string;
  macAddress: string;
  natGwDp: string;
  qosPolicy: string;
  externalSubnet: string;
}
interface EIPStatus {
  ready: boolean;
  ip: string;
  redo: string;
  nat: string;
  qosPolicy: string;
  conditions?: Condition[];
}

interface FIPSpec {
  eip: string;
  internalIp: string;
}

interface FIPStatus {
  ready: boolean;
  v4ip: string;
  v6ip: string;
  natGwDp: string;
  redo: string;
  internalIp: string;
  conditions?: Condition[];
}

interface SNATSpec {
  eip: string;
  internalCIDR: string;
}

interface SNATStatus {
  ready: boolean;
  v4ip: string;
  v6ip: string;
  natGwDp: string;
  redo: string;
  internalCIDR: string;
  conditions?: Condition[];
}

export interface DNAT {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: DNATSpec;
  status: DNATStatus;
}

interface DNATSpec {
  eip: string;
  externalPort: string;
  protocol?: string;
  internalIp: string;
  internalPort: string;
}
interface DNATStatus {
  ready: boolean;
  v4ip: string;
  v6ip: string;
  natGwDp: string;
  redo: string;
  protocol: string;
  internalIp: string;
  internalPort: string;
  externalPort: string;
  conditions?: Condition[];
}
