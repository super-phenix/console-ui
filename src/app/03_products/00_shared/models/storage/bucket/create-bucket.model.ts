export interface BucketConfig {
  maxObjects?: number;
  maxSize?: string;
  policy?: string;
  lifecycle?: string;
}

export class CreateBucket {
  constructor(init: Partial<CreateBucket>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];
  }

  general!: {
    productName: string;
    storageClass: string;
    config: BucketConfig;
  };
}

export interface UpdateBucket {
  general: {
    productName: string;
    config: BucketConfig;
  };
}
