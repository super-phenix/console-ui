/**
 * Abstract quota resources handled by the console. Values are Kubernetes quantities
 * ("16", "500m" for the CPU, "64Gi" for the memory and the disk).
 *
 * A resource absent from the map is not limited by this level, a resource set to "0" is limited to zero.
 */
export enum QuotaResourceEnum {
  CPU = 'cpu',
  Memory = 'memory',
  Disk = 'disk',
}

export const QUOTA_RESOURCES: QuotaResourceEnum[] = [
  QuotaResourceEnum.CPU,
  QuotaResourceEnum.Memory,
  QuotaResourceEnum.Disk,
];

export type QuotaResources = Partial<Record<QuotaResourceEnum, string>>;

/** Stored project quota, as returned by the API. */
export interface ProjectQuota {
  projectId: string;
  organizationId: string;
  limit: QuotaResources;
}

/** Stored quota of a project in one AZ, as returned by the API. */
export interface ProjectAZQuota {
  projectId: string;
  codeAZ: string;
  limit: QuotaResources;
}

/**
 * Quota of a project in one AZ and what the project currently uses there.
 * Kubernetes only tracks the limited resources: a resource without limit in the AZ is absent from `used`.
 */
export interface AZQuotaOverview {
  codeAZ: string;
  limit?: QuotaResources;
  /** false when the AZ could not be reached, `used` is then empty */
  available: boolean;
  used: QuotaResources;
}

/** The quota of an organization and its distribution to projects. */
export interface OrganizationQuotaOverview {
  organizationId: string;
  unlimited: boolean;
  limit?: QuotaResources;
  allocated: QuotaResources;
  remaining?: QuotaResources;
  projectQuotas: ProjectQuota[] | null;
}

/** The quota of a project and its distribution to AZs. */
export interface ProjectQuotaOverview {
  projectId: string;
  organizationId: string;
  unlimited: boolean;
  limit?: QuotaResources;
  allocated: QuotaResources;
  remaining?: QuotaResources;
  azQuotas: AZQuotaOverview[] | null;
}
