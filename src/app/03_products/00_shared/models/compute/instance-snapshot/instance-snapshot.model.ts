import { ObjectMeta } from '../../common.model';

export interface InstanceSnapshot {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: InstanceSnapshotSpec;
  status: InstanceSnapshotStatus;
}

export interface InstanceSnapshotContent {
  vm: {
    localId: string;
    effectiveId: string;
  };
  volumesSnapshot: string[];
}

interface InstanceSnapshotSpec {
  source: InstanceSnapshotSource;
}

interface InstanceSnapshotSource {
  name: string;
}

interface InstanceSnapshotStatus {
  virtualMachineSnapshotContentName: string;
  creationTime: Date;
  readyToUse?: boolean;
  phase: string;
  restoreSize: unknown;
  snapshotVolumes: SnapshotVolume;
  error?: {
    time: Date;
    message: string;
  };
}

interface SnapshotVolume {
  excludedVolumes: string[];
  includedVolumes: string[];
}
