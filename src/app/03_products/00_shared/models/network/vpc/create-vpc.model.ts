import { StaticRoute } from './vpc.model';

export class CreateVPC {
  constructor(init: Partial<CreateVPC>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];
  }

  general!: {
    productName: string;
  };
}

export class UpdateVPC {
  general!: {
    productName: string;
  };

  staticRoutes?: StaticRoute[];
}
