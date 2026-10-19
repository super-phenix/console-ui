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

/** Stored project quota, as returned by the API (the Go model has no JSON tags). */
export interface ProjectQuota {
  ProjectId: string;
  OrganizationId: string;
  Resources: QuotaResources;
}

/** Stored quota of a project in one AZ, as returned by the API (the Go model has no JSON tags). */
export interface ProjectAZQuota {
  ID: string;
  ProjectId: string;
  CodeAZ: string;
  Resources: QuotaResources;
}

/** The quota of an organization and its distribution to projects. */
export interface OrganizationQuotaOverview {
  organizationId: string;
  unlimited: boolean;
  resources?: QuotaResources;
  allocated: QuotaResources;
  remaining?: QuotaResources;
  projectQuotas: ProjectQuota[] | null;
}

/** The quota of a project and its distribution to AZs. */
export interface ProjectQuotaOverview {
  projectId: string;
  organizationId: string;
  resources?: QuotaResources;
  azQuotas: ProjectAZQuota[] | null;
}

/**
 * What a project currently uses in one AZ. Kubernetes only tracks the limited resources: a resource
 * the project has no limit for in this AZ is absent from `used`.
 */
export interface QuotaAZUsage {
  codeAZ: string;
  /** false when the AZ could not be reached, `used` is then empty */
  available: boolean;
  used: QuotaResources;
  kubernetesUsed?: Record<string, string>;
}

/** What a project currently uses, per AZ and summed over its AZs. */
export interface QuotaProjectUsage {
  projectId: string;
  /** false when the usage of at least one AZ is unavailable (`used` then misses it) */
  complete: boolean;
  used: QuotaResources;
  azs: QuotaAZUsage[] | null;
}

/** What an organization currently uses, per project and summed over its projects. */
export interface QuotaOrganizationUsage {
  organizationId: string;
  /** false when the usage of at least one project is incomplete */
  complete: boolean;
  used: QuotaResources;
  projects: QuotaProjectUsage[] | null;
}
