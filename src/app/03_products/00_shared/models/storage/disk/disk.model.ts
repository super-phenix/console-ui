import { Condition, ObjectMeta, Resources } from '../../common.model';

export interface Disk {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: DiskSpec;
  status: DiskStatus;
}

export interface MountStatus {
  isMounted: boolean;
  by: string;
}

interface DiskSpec {
  source: DiskSource;
  storage: Storage;
}

interface DiskSource {
  blank?: unknown;
  http?: Http;
  registry?: Registry;
  pvc?: PVC;
  snapshot?: Snapshot;
}

interface Registry {
  url: string;
}

interface Http {
  url: string;
}

interface PVC {
  name: string;
  namespace: string;
}

interface Snapshot {
  name: string;
  namespace: string;
}

interface Storage {
  accessModes: string[];
  resources: Resources;
  volumeMode: string;
}

interface DiskStatus {
  claimName: string;
  conditions: Condition[];
  phase: string;
  progress: string;
}
