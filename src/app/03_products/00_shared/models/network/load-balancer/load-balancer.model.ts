import { Condition, ObjectMeta } from '../../common.model';

export interface LoadBalancer {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: LoadBalancerSpec;
  status: LoadBalancerStatus;
}

interface LoadBalancerSpec {
  vip: string;
  namespace: string;
  selector: string[];
  endpoints: string[];
  sessionAffinity: string;
  ports: LBRulePort[];
}

interface LoadBalancerStatus {
  // Conditions represents the latest state of the object
  conditions: Condition[];
  ports: string;
  service: string;
}

interface LBRulePort {
  name: string;
  port: number;
  targetPort: number;
  protocol: string;
}

export interface RulePort {
  port: number;
  targetPort: number;
  protocol: 'TCP' | 'UDP';
}
