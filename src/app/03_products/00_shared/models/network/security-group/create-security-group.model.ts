import { LabelSelector, Peer } from '@products/00_shared/models/common.model';
import { SgRulePort } from './security-group.model';

export class CreateSecurityGroup {
  constructor(init: Partial<CreateSecurityGroup>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];
  }

  general!: {
    productName: string;
    description?: string | null;
  };
  spec!: SecurityGroupCreationSpec;
}

export class UpdateSecurityGroup {
  general!: {
    productName: string;
    description?: string | null;
  };
  spec!: SecurityGroupCreationSpec;
}

export interface SecurityGroupCreationSpec {
  target?: LabelSelector;
  ingress?: IngressRule[];
  egress?: EgressRule[];
}

export interface IngressRule {
  ports?: SgRulePort[];
  from?: Peer[];
  denyAll?: boolean;
  allowAll?: boolean;
}

export interface EgressRule {
  ports?: SgRulePort[];
  to?: Peer[];
  denyAll?: boolean;
  allowAll?: boolean;
}
