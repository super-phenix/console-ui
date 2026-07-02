import { ObjectMeta } from '../../common.model';

export const BACKUP_TYPE_STANDALONE = 'Standalone';
export const BACKUP_TYPE_ORPHAN = 'Orphan';
export const BACKUP_TYPE_SCHEDULE = 'Schedule';

export type BackupType = typeof BACKUP_TYPE_STANDALONE | typeof BACKUP_TYPE_ORPHAN | typeof BACKUP_TYPE_SCHEDULE;

export interface BaaS {
  metadata: ObjectMeta;
  backup?: Backup;
  schedule?: Schedule;
  standalone: boolean;
  orphan: boolean;
}

export interface Backup {
  metadata: ObjectMeta;
  spec: BackupSpec;
  status: BackupStatus;
}

export interface BackupSpec {
  labelSelector: BaasLabelSelector;
  ttl: string;
}
export interface BackupStatus {
  phase: string;
  failureReason: string;
  warnings: number;
  errors: number;
  progress: {
    totalItems: number;
    itemsBackedUp: number;
  };
  completionTimestamp: string;
}

export interface Schedule {
  metadata: ObjectMeta;
  spec: ScheduleSpec;
  status: ScheduleStatus;
  backups?: Backup[];
}

export interface ScheduleSpec {
  schedule: string;
  paused: boolean;
  labelSelector: BaasLabelSelector;
  ttl: string;
}
export interface ScheduleStatus {
  phase: string;
  lastBackup: string;
}

interface BaasLabelSelector {
  matchLabels?: Record<string, string>;
}
