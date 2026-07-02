export const DiskSourceTypeRegistry = 'registry';
export const DiskSourceTypeHttp = 'http';
export const DiskSourceTypeSnapshot = 'snapshot';
export const DiskSourceTypeClone = 'clone';
export const DiskSourceTypeBlank = 'blank';

export const DiskSourceTypes = [
  DiskSourceTypeBlank,
  DiskSourceTypeHttp,
  DiskSourceTypeSnapshot,
  DiskSourceTypeClone,
  DiskSourceTypeRegistry,
] as const;

export type DiskSourceType = (typeof DiskSourceTypes)[number];

export class CreateDisk {
  constructor(init: Partial<CreateDisk>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];

    this.general.storage = this.general.storage + ''; // force string value;
  }

  general!: {
    productName: string;
    labels?: string[];
    storage: string;
    source: DiskSource;
    storageClass: string;
  };
}

export interface DiskSource {
  type: DiskSourceType;
  url?: string;
  clone?: string;
  snapshot?: string;
}

export class UpdateDisk {
  general!: {
    productName: string;
    labels?: string[];
    storage: string;
  };
}
