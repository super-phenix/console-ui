import { LabelSelectorMap, MatchLabel, ObjectMeta, Peer, PeerMap } from '../../common.model';

export interface SecurityGroup {
  metadata: ObjectMeta;
  spec: SecurityGroupSpec;
  description: string;
}

export interface SecurityGroupSpec {
  ingress: IngressRuleMap[];
  egress: EgressRuleMap[];
  podSelector: LabelSelectorMap;
  policyTypes: string[];
}

export interface IngressRuleMap {
  ports?: SgRulePort[];
  from?: PeerMap[];
  denyAll?: boolean;
  allowAll?: boolean;
}

export interface EgressRuleMap {
  ports?: SgRulePort[];
  to?: PeerMap[];
  denyAll?: boolean;
  allowAll?: boolean;
}

export interface SgRulePort {
  port: number;
  endPort: number;
  protocol: 'TCP' | 'UDP';
}

export function PeerMapToArray(map: PeerMap[] | undefined): Peer[] | undefined {
  if (map == undefined) {
    return undefined;
  }
  if (map.length <= 0) {
    return [];
  }
  const from: Peer[] = [];
  map.forEach(el => {
    const res: Peer = {
      ipBlock: el.ipBlock,
      podSelector: {},
    };

    res.podSelector!.matchExpressions = el.podSelector?.matchExpressions;

    if (el.podSelector && el.podSelector.matchLabels) {
      const labels: MatchLabel[] = [];
      Object.entries(el.podSelector.matchLabels).forEach(([key, value]) => {
        labels.push({ key, value });
      });

      res.podSelector!.matchLabels = labels;
    }

    from.push(res);
  });

  return from;
}
