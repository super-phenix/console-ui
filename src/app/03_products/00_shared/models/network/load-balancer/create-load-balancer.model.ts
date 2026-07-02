import { RulePort } from './load-balancer.model';

export class CreateLoadBalancer {
  constructor(init: Partial<CreateLoadBalancer>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];
  }

  general!: {
    productName: string;
  };
  spec!: {
    vip: string;
    selectors: string[];
    endpoints: string[];
    ports: RulePort[];
  };
}

export class UpdateLoadBalancer {
  general!: {
    productName: string;
  };
  spec!: {
    vip: string;
    selectors: string[];
    endpoints: string[];
    ports: RulePort[];
  };
}
