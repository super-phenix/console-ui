export class CreateSnapshot {
  constructor(init: Partial<CreateSnapshot>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];
  }

  general!: {
    productName: string;
  };
  spec!: {
    scheduled: boolean;
    schedule?: number;
    paused?: boolean;
    source?: string;
    labelSelector?: string[];
    retention?: RetentionPolicy;
  };
}

export interface RetentionPolicy {
  expiryTime: number;
}

export class UpdateSnapshot {
  general!: {
    productName: string;
  };
  spec!: {
    schedule?: number;
    paused?: boolean;
    labelSelector?: string[];
    retention?: RetentionPolicy;
  };
}
