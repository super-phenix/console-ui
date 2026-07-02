import { ORGANIZATION_ID_LABEL_KEY, PROJECT_ID_LABEL_KEY } from '@shared/models/consts';

export interface ProductLabelInfo {
  projectId?: string;
  organizationId?: string;
}

function parseSpxId(value?: string): string | undefined {
  if (!value) return undefined;
  const prefix = 'spx-';
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

export function getProductLabelInfo(labels?: Record<string, string>): ProductLabelInfo {
  return {
    projectId: parseSpxId(labels?.[PROJECT_ID_LABEL_KEY]),
    organizationId: parseSpxId(labels?.[ORGANIZATION_ID_LABEL_KEY]),
  };
}
