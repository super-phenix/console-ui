export class CreateInstanceSnapshot {
  constructor(init: Partial<CreateInstanceSnapshot>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];

    this.general.source = this.general.source + ''; // force string value;
  }

  general!: {
    productName: string;
    source: string;
  };
}
