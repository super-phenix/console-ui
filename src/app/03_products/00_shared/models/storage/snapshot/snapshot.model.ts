import { Condition, ObjectMeta } from '../../common.model';

export interface SnapshotSchedule {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: SnapshotScheduleSpec;
  status: SnapshotScheduleStatus;
  children?: Snapshot[];
  childrenCount: number;
}

export interface SnapshotScheduleSpec {
  claimSelector?: SnapshotScheduleLabelSelector;
  retention?: {
    expires: string;
  };
  schedule?: string;
  disabled?: boolean;
}

interface SnapshotScheduleLabelSelector {
  matchLabels?: Record<string, string>;
}
export interface SnapshotScheduleStatus {
  conditions: Condition[];
  lastSnapshotTime?: string;
  nextSnapshotTime?: string;
}

export interface Snapshot {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: SnapshotSpec;
  status: SnapshotStatus;
}

interface SnapshotSpec {
  source: SnapshotSource;
  volumeSnapshotClassName: string;
}

interface SnapshotSource {
  persistentVolumeClaimName: string;
  volumeSnapshotContentName: string;
}

interface SnapshotStatus {
  boundVolumeSnapshotContentName: string;
  creationTime: Date;
  readyToUse?: boolean;
  restoreSize: string;
  error: {
    time: Date;
    message: string;
  };
}
