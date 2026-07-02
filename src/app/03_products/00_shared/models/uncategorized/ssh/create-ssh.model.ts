export class CreateSSH {
  constructor(init: Partial<CreateSSH>) {
    Object.assign(this, init);
    // Used to remove the field present in form as cast in Typescript won't remove non existing field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this as any).general['az'];

    this.general.publicKey = this.general.publicKey + ''; // force string value;
  }

  general!: {
    productName: string;
    publicKey: string;
  };
}
