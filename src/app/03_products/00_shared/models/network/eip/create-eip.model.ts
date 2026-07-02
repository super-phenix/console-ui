export class CreateEIP {
  constructor(init: Partial<CreateEIP>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];
  }

  general!: {
    productName: string;
    subnetEId: string; // Subnet EID
  };
  spec!: {
    internalIP: string | null;
    snat: string[] | null;
    dnat: CreateDnat[] | null;
  };
}

export interface CreateDnat {
  externalPort: string;
  internalIP: string;
  internalPort: string;
  protocol: 'tcp' | 'udp';
}

export class UpdateEIP {
  general!: {
    productName: string;
  };
  spec!: {
    internalIP: string | null;
    snat: string[] | null;
    dnat: CreateDnat[] | null;
  };
}
