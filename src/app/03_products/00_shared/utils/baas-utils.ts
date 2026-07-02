import {
  BaaS,
  BACKUP_TYPE_ORPHAN,
  BACKUP_TYPE_SCHEDULE,
  BACKUP_TYPE_STANDALONE,
} from '../models/storage/baas/baas.model';

export const BAAS_TYPE_LABEL_KEY = 'superphenix.net/backupType';

// Get backup scope
// Return a BackupScope
export function getBackupScope(labels?: Record<string, string>): string {
  return labels?.[BAAS_TYPE_LABEL_KEY] || '';
}

export function getBackupType(baas?: BaaS): string {
  if (!baas) {
    return '';
  }
  if (baas.standalone) {
    return BACKUP_TYPE_STANDALONE;
  } else if (baas.orphan) {
    return BACKUP_TYPE_ORPHAN;
  } else {
    return BACKUP_TYPE_SCHEDULE;
  }
}

export function getLastBackup(baas?: BaaS): string {
  if (!baas) {
    return '';
  }

  return baas.schedule?.status.lastBackup || baas.backup?.status.completionTimestamp || '';
}
