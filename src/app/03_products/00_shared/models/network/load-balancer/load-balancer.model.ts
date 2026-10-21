import { Condition, ObjectMeta } from '../../common.model';

export interface LoadBalancer {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  // Subnet the load balancer is pinned to, empty for load balancers created before pinning
  subnetEId?: string;
  // Source IP of the health checks
  healthCheckIP?: string;
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
