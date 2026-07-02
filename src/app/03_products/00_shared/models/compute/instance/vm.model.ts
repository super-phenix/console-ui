import { ObjectMeta } from '../../common.model';
import { VirtualMachineInstanceSpec } from './vmi.model';

type VirtualMachineRunStrategy = string;

export interface VirtualMachine {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: VirtualMachineSpec;
  status: Status;
}

interface VirtualMachineSpec {
  running?: boolean;
  runStrategy?: VirtualMachineRunStrategy;
  preference?: Preference;
  template?: {
    metadata: ObjectMeta;
    spec: VirtualMachineInstanceSpec;
  };
}

interface Preference {
  name?: string;
}

interface Status {
  created: boolean;
  ready: boolean;
  printableStatus: string;
}
