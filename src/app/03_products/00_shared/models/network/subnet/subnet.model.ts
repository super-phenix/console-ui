import { Condition, ObjectMeta } from '../../common.model';

export const policySrc = 'policySrc';
export const policyDst = 'policyDst';

export interface Subnet {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  isShared: boolean;
  spec: SubnetSpec;
  status: SubnetStatus;
}

export interface NatGateway {
  kind: string;
  apiVersion: string;
  metadata: ObjectMeta;
  spec: NatGatewaySpec;
  status: NatGatewayStatus;
}

interface SubnetSpec {
  default: boolean;
  vpc?: string;
  protocol?: string;
  namespaces?: string[];
  cidrBlock: string;
  gateway: string;
  excludeIps?: string[];
  gatewayType?: string;
  gatewayNode: string;
  natOutgoing: boolean;

  private: boolean;
  dhcpV4Options: string | null;
  dhcpV6Options: string | null;

  natOutgoingPolicyRules?: NatOutgoingPolicyRule[];
}

interface SubnetStatus {
  // Conditions represents the latest state of the object
  // +optional
  conditions?: Condition[];

  v4availableIPs: number;
  v4availableIPrange: string;
  v4usingIPs: number;
  v4usingIPrange: string;
  v6availableIPs: number;
  v6availableIPrange: string;
  v6usingIPs: number;
  v6usingIPrange: string;
  activateGateway: string;
  natOutgoingPolicyRules: NatOutgoingPolicyRuleStatus[];
}

interface NatOutgoingPolicyRule {
  match: NatOutGoingPolicyMatch;
  action: string;
}
interface NatOutgoingPolicyRuleStatus extends NatOutgoingPolicyRule {
  ruleID: string;
}
interface NatOutGoingPolicyMatch {
  srcIPs?: string;
  dstIPs?: string;
}

interface NatGatewaySpec {
  vpc: string;
  subnet: string;
  externalSubnets: string[];
  lanIp: string;
  qosPolicy: string;
}
interface NatGatewayStatus {
  qosPolicy: string[];
  externalSubnets: string[];
}
