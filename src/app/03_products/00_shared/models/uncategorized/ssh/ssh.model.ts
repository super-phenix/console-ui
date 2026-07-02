import { ObjectMeta } from '../../common.model';

export interface SSH {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  data: {
    key1: string;
  };
  type: string;
}
