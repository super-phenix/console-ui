import { Product } from '../../product.model';

export type BackupScope = 'all' | 'vm';
export type BackupCreateType = 'scheduled' | 'onetime';

export interface RetentionPolicy {
  expiryTime: number;
}

export class CreateBaaS {
  general!: {
    productName: string;
  };
  spec!: {
    scheduled: boolean;
    schedule?: number;
    retention?: RetentionPolicy;
    paused?: boolean;
    labelSelector: string[];
    type: BackupScope;
  };
}

export class UpdateBaaSProduct extends Product {
  spec?: {
    scheduled: boolean;
    schedule?: number;
    retention?: RetentionPolicy;
    paused?: boolean;
    labelSelector: string[];
    type: BackupScope;
  };
}

export class UpdateBaaS {
  general!: {
    productName: string;
  };
  spec!: {
    schedule?: number;
    retention?: RetentionPolicy;
    paused?: boolean;
    labelSelector: string[];
  };
}
