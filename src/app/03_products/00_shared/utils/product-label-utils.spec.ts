import { getProductLabelInfo } from './product-label-utils';
import { ORGANIZATION_ID_LABEL_KEY, PROJECT_ID_LABEL_KEY } from '@shared/models/consts';

describe('getProductLabelInfo', () => {
  it('should return undefined values when no labels are provided', () => {
    const result = getProductLabelInfo();
    expect(result.projectId).toBeUndefined();
    expect(result.organizationId).toBeUndefined();
  });

  it('should return undefined values when labels are empty', () => {
    const result = getProductLabelInfo({});
    expect(result.projectId).toBeUndefined();
    expect(result.organizationId).toBeUndefined();
  });

  it('should parse projectId and organizationId from labels with spx- prefix', () => {
    const labels = {
      [PROJECT_ID_LABEL_KEY]: 'spx-project-123',
      [ORGANIZATION_ID_LABEL_KEY]: 'spx-org-456',
    };
    const result = getProductLabelInfo(labels);
    expect(result.projectId).toBe('project-123');
    expect(result.organizationId).toBe('org-456');
  });

  it('should return raw values when labels do not have spx- prefix', () => {
    const labels = {
      [PROJECT_ID_LABEL_KEY]: 'project-123',
      [ORGANIZATION_ID_LABEL_KEY]: 'org-456',
    };
    const result = getProductLabelInfo(labels);
    expect(result.projectId).toBe('project-123');
    expect(result.organizationId).toBe('org-456');
  });

  it('should handle partial labels (only projectId)', () => {
    const labels = {
      [PROJECT_ID_LABEL_KEY]: 'spx-project-123',
    };
    const result = getProductLabelInfo(labels);
    expect(result.projectId).toBe('project-123');
    expect(result.organizationId).toBeUndefined();
  });

  it('should handle partial labels (only organizationId)', () => {
    const labels = {
      [ORGANIZATION_ID_LABEL_KEY]: 'spx-org-456',
    };
    const result = getProductLabelInfo(labels);
    expect(result.projectId).toBeUndefined();
    expect(result.organizationId).toBe('org-456');
  });
});
