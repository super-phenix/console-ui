export type FieldsV1 = Map<string, string>;

export interface ObjectMeta {
  name: string;
  generateName?: string;
  namespace: string;
  creationTimestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  ownerReferences: OwnerReference[];
}

export interface OwnerReference {
  apiVersion: string;
  kind: string;
  name: string;
  uid: string;
  controller: boolean;
  blockOwnerDeletion: boolean;
}

export interface Condition {
  // Type of condition.
  type: string;
  // Status of the condition, one of True, False, Unknown.
  status: string;
  // The reason for the condition's last transition.
  // +optional
  reason?: string;
  // A human readable message indicating details about the transition.
  // +optional
  message?: string;
  // Last time the condition was probed
  // +optional
  lastUpdateTime?: Date;
  // Last time the condition transitioned from one status to another.
  // +optional
  lastTransitionTime?: Date;
}

export interface Resources {
  requests: Record<string, string>;
  limits: Record<string, string>;
}

export interface ObjectReference {
  apiVersion: string;
  kind: string;
  name: string;
}

//  Matching Label & Expression
export const OPERATOR_IN = 'In';
export const OPERATOR_NOT_IN = 'NotIn';
export const OPERATOR_EXISTS = 'Exists';
export const OPERATOR_DOES_NOT_EXIST = 'DoesNotExist';
export const EXPRESSION_OPERATORS = [OPERATOR_IN, OPERATOR_NOT_IN, OPERATOR_EXISTS, OPERATOR_DOES_NOT_EXIST] as const;
export type ExpressionOperators = (typeof EXPRESSION_OPERATORS)[number];

export interface MatchLabel {
  key: string;
  value: string;
}

export interface MatchExpression {
  key: string;
  operator: ExpressionOperators;
  values?: string[];
}

export interface LabelSelector {
  matchLabels?: MatchLabel[];
  matchExpressions?: MatchExpression[];
}

export interface LabelSelectorMap {
  matchLabels?: Map<string, string>;
  matchExpressions?: MatchExpression[];
}

export interface IPBlock {
  cidr: string;
  except?: string[];
}

export interface Peer {
  podSelector?: LabelSelector;
  ipBlock?: IPBlock;
}

export interface PeerMap {
  podSelector?: LabelSelectorMap;
  ipBlock?: IPBlock;
}
