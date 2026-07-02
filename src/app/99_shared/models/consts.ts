export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export const MAX_NAME_LENGTH = 63;
export const MAX_CONTACT_LENGTH = 255;

export const LABEL_VALUE_MAX_LENGTH = 63;
export const LABEL_VALUE_PATTERN = '^[a-z0-9A-Z][a-z0-9A-Z\\-._]*[a-z0-9A-Z]?$';
export const LABEL_KEY_MAX_LENGTH = 253 - LABEL_VALUE_MAX_LENGTH;
export const LABEL_KEY_PATTERN = '^[a-z0-9A-Z][a-z0-9A-Z\\-\\/._]*[a-z0-9A-Z]?$';

export const LABEL_PATTERN =
  '^([a-z0-9A-Z](?:[a-z0-9A-Z\\-._]*[a-z0-9A-Z]{1})?\\/)?([a-z0-9A-Z](?:[a-z0-9A-Z\\-._]{0,61}[a-z0-9A-Z]{1})?):([a-z0-9A-Z]{1}(?:[a-z0-9A-Z\\-._]{0,61}[a-z0-9A-Z]{1})?)?$';
export const LABEL_REGEX = new RegExp(LABEL_PATTERN);
export const LABEL_MAX_LENGTH = 253;

export const CUSTOM_USER_LABEL_PREFIX = 'user.superphenix.net/';
export const CUSTOM_USER_LABEL_NUMBER = 10;

export const PRA_LABEL_KEYS = ['velero.io/backup-name', 'velero.io/restore-name'];
export const REPLICATION_ANNOTATION_KEYS = ['replication.storage.openshift.io/volume-replication-name'];

export const APP_NAME_LABEL_KEY = 'app.kubernetes.io/name';
export const APP_NAME_CLUSTER_LABEL_VALUE = 'sfs-kaas';

export const DEFAULT_REFRESH_INTERVAL = 0;

export const VIRTUAL_IP_RANGE = '198.18.0.0/16';

export const SHARED_SUBNET_LABEL = 'superphenix.net/shared-subnet';

export const PROJECT_ID_LABEL_KEY = 'superphenix.net/projectID';
export const ORGANIZATION_ID_LABEL_KEY = 'superphenix.net/organizationID';
