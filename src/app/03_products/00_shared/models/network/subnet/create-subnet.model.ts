import { ProtocolEnum } from './protocol.enum';

export class CreateSubnet {
  constructor(init: Partial<CreateSubnet>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];
  }

  general!: {
    productName: string;
    vpcEId: string; // VPC Effective Id
  };
  network!: {
    private: boolean;
    protocol: ProtocolEnum;
    ipv4: string | null;
    ipv6: string | null;
    dnsV4: string | null;
    dnsV6: string | null;
  };
  natGateway?: {
    enable: boolean;
  };
}

export class UpdateSubnet {
  general!: {
    productName: string;
  };
  network!: {
    private: boolean;
    dnsV4: string | null;
    dnsV6: string | null;
  };
  natGateway?: {
    enable: boolean;
  };
}
