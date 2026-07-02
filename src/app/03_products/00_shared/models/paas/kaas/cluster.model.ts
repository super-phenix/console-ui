import { ObjectMeta } from '../../common.model';

export interface Cluster {
  cluster: ClusterDetails;
  machineDeployments: MachineDeployments[];
}

export interface ClusterDetails {
  metadata: ObjectMeta;
}

export interface MachineDeployments {
  machineDeployment: MachineDeployment;
  machineTemplate: KubevirtMachineTemplate;
}

export interface MachineDeployment {
  metadata: ObjectMeta;
  spec: {
    clusterName: string;
    replicas: number;
    template: {
      spec: {
        infrastructureRef: {
          name: string;
        };
        version: string;
      };
    };
  };
  status: {
    availableReplicas: number;
    readyReplicas: number;
    replicas: number;
    upToDateReplicas: number;
  };
}

export interface KubevirtMachineTemplate {
  metadata: ObjectMeta;
  dataVolumeTemplates: DataVolumeTemplate[];
  machineTemplate: MachineTemplate;
}

export interface DataVolumeTemplate {
  registryUrl: string;
  storageSize: string;
  volumeMode: string;
}

export interface MachineTemplate {
  cpu: MachineTemplateCPU;
  memory: MachineTemplateMemory;
  preference: MachineTemplatePreference;
}

export interface MachineTemplateCPU {
  cores: number;
  sockets: number;
  threads: number;
}

export interface MachineTemplateMemory {
  guest: string;
}

export interface MachineTemplatePreference {
  name: string;
}
