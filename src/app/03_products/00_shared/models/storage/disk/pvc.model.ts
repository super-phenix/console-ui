import { ObjectMeta, ObjectReference, Resources } from '../../common.model';

export interface PVC {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: PVCSpec;
  status: PVCStatus;
}

interface PVCSpec {
  accessModes: string[];
  resources: Resources;
  volumeMode: string;
  volumeName: string;
  storageClassName: string;
  dataSource: ObjectReference;
}

interface PVCStatus {
  phase: string;
  accessModes: string[];
  capacity: {
    storage: string;
  };
}
