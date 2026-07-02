import { LabelSelector, Peer } from '@products/00_shared/models/common.model';
import { FwRulePort } from './firewall.model';

export class CreateFirewall {
  constructor(init: Partial<CreateFirewall>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];
  }

  general!: {
    productName: string;
    description?: string | null;
  };
  spec!: FirewallCreationSpec;
}

export class UpdateFirewall {
  general!: {
    productName: string;
    description?: string | null;
  };
  spec!: FirewallCreationSpec;
}

export interface FirewallCreationSpec {
  target?: LabelSelector;
  ingress?: IngressRule[];
  egress?: EgressRule[];
}

export interface IngressRule {
  ports?: FwRulePort[];
  from?: Peer[];
  denyAll?: boolean;
  allowAll?: boolean;
}

export interface EgressRule {
  ports?: FwRulePort[];
  to?: Peer[];
  denyAll?: boolean;
  allowAll?: boolean;
}
