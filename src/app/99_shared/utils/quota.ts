// Kubernetes quantities used by the quotas: CPU in cores ("16", "500m"), memory and disk in bytes ("64Gi").
import { formatBytes } from '@products/00_shared/utils/quantity';
import { QuotaResourceEnum, QuotaResources } from '@shared/models/data/quota';

export const QUOTA_RESOURCE_LABELS: Record<QuotaResourceEnum, string> = {
  [QuotaResourceEnum.CPU]: 'CPU',
  [QuotaResourceEnum.Memory]: 'RAM',
  [QuotaResourceEnum.Disk]: 'Disk',
};

export const QUOTA_RESOURCE_ICONS: Record<QuotaResourceEnum, string> = {
  [QuotaResourceEnum.CPU]: 'memory',
  [QuotaResourceEnum.Memory]: 'memory_alt',
  [QuotaResourceEnum.Disk]: 'hard_drive',
};

/** Holder of a quota shared among children: an organization among its projects, a project among its AZs. */
export type QuotaParentType = 'organization' | 'project';

/** Name of the parent, e.g. "the parent organization" */
export const QUOTA_PARENT_LABELS: Record<QuotaParentType, string> = {
  organization: 'organization',
  project: 'project',
};

/** Name of the children sharing the parent quota, e.g. "the projects" */
export const QUOTA_CHILDREN_LABELS: Record<QuotaParentType, string> = {
  organization: 'projects',
  project: 'availability zones',
};

export const QUOTA_BYTE_UNITS = ['Gi', 'Ti'] as const;
export type QuotaByteUnit = (typeof QUOTA_BYTE_UNITS)[number];

const QUANTITY_REGEX = /^(\d+(?:\.\d+)?)(m|k|M|G|T|P|E|Ki|Mi|Gi|Ti|Pi|Ei)?$/;

const MULTIPLIERS: Record<string, number> = {
  m: 1e-3,
  k: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
  E: 1e18,
  Ki: 2 ** 10,
  Mi: 2 ** 20,
  Gi: 2 ** 30,
  Ti: 2 ** 40,
  Pi: 2 ** 50,
  Ei: 2 ** 60,
};

/**
 * Parses a quota quantity into its canonical number: millicores for the CPU, bytes otherwise
 * (same as the API). Returns null when the quantity is missing or unparseable.
 */
export function parseQuotaQuantity(resource: QuotaResourceEnum, quantity: string | undefined | null): number | null {
  if (quantity === undefined || quantity === null) {
    return null;
  }
  const match = QUANTITY_REGEX.exec(quantity.trim());
  if (!match) {
    return null;
  }
  const value = parseFloat(match[1]) * (match[2] ? MULTIPLIERS[match[2]] : 1);
  // Rounded up like the API, the epsilon absorbs the floating point errors (e.g. 0.1 * 1000)
  const canonical = resource === QuotaResourceEnum.CPU ? value * 1000 : value;
  return Math.max(Math.ceil(canonical - 1e-9), 0);
}

/** Formats a canonical number (see parseQuotaQuantity) for display, e.g. 1500 -> "1.5 vCPU", 2^31 -> "2 GiB". */
export function formatQuotaQuantity(resource: QuotaResourceEnum, value: number): string {
  if (resource === QuotaResourceEnum.CPU) {
    const cores = Math.round(value) / 1000;
    return `${parseFloat(cores.toFixed(3))} vCPU`;
  }
  return formatBytes(value);
}

/** Converts a form value (cores for the CPU, `unit` otherwise) into a quota quantity. */
export function toQuotaQuantity(resource: QuotaResourceEnum, value: number, unit?: QuotaByteUnit): string {
  if (resource === QuotaResourceEnum.CPU) {
    const millis = Math.round(value * 1000);
    return millis % 1000 === 0 ? `${millis / 1000}` : `${millis}m`;
  }
  return `${parseFloat(value.toFixed(3))}${unit ?? 'Gi'}`;
}

/** Splits a canonical number into a form value: cores for the CPU, the largest exact unit (Gi or Ti) otherwise. */
export function toQuotaFormValue(resource: QuotaResourceEnum, value: number): { value: number; unit?: QuotaByteUnit } {
  if (resource === QuotaResourceEnum.CPU) {
    return { value: value / 1000 };
  }
  if (value > 0 && value % MULTIPLIERS['Ti'] === 0) {
    return { value: value / MULTIPLIERS['Ti'], unit: 'Ti' };
  }
  return { value: parseFloat((value / MULTIPLIERS['Gi']).toFixed(3)), unit: 'Gi' };
}

/** Route and fragment opening the Quotas tab of the organization settings */
export const QUOTA_SETTINGS_LINK = ['/organization', 'settings'];
export const QUOTA_SETTINGS_FRAGMENT = 'quotas';

/** How full a quota is: what is used of what is allocated. */
export interface QuotaFill {
  /** e.g. "3 vCPU / 6 vCPU", or why there is nothing to compare */
  text: string;
  /** Share of the allocation used (can exceed 100), null when there is nothing to compare */
  percent: number | null;
  /** Width of the meter, capped at 100 */
  meter: number;
  /** Everything allocated is used */
  full: boolean;
  /** Nothing is allocated to this resource */
  nothingAllocated?: boolean;
  /** The AZ could not be reached */
  unavailable: boolean;
}

/**
 * How full a quota is. `used` is null when the usage is unavailable, undefined when Kubernetes does not
 * track it (nothing limits the resource) or while loading; `limit` is null when not limited.
 */
export function quotaFill(
  resource: QuotaResourceEnum,
  used: number | null | undefined,
  limit: number | null
): QuotaFill {
  const empty = { percent: null, meter: 0, full: false, unavailable: false };
  if (used === null) {
    return { ...empty, text: 'Usage unavailable', unavailable: true };
  }
  if (used === undefined) {
    return { ...empty, text: limit === null ? '∞' : `${formatQuotaQuantity(resource, limit)} allocated` };
  }
  const format = (value: number) => formatQuotaQuantity(resource, value);
  if (limit === null) {
    return { ...empty, text: `${format(used)} / ∞` };
  }
  if (limit === 0 && used === 0) {
    return { ...empty, text: 'Nothing allocated', nothingAllocated: true };
  }
  const percent = limit > 0 ? (used / limit) * 100 : 100;
  return {
    text: `${format(used)} / ${format(limit)}`,
    percent,
    meter: Math.min(percent, 100),
    full: percent >= 100,
    unavailable: false,
  };
}

/** A child sharing the quota of its parent; a null value means the child is not limited. */
export interface QuotaBarPart {
  key: string;
  label: string;
  value: number | null;
}

export interface QuotaBarSegment extends QuotaBarPart {
  /** Width of the segment in the bar, in percent */
  percent: number;
  /** Share of the parent limit, in percent (null when the parent is not limited) */
  share: number | null;
  colorIndex: number;
}

export interface QuotaBar {
  limit: number | null;
  allocated: number;
  /** What remains to allocate (null when the parent is not limited) */
  free: number | null;
  freePercent: number;
  overcommitted: boolean;
  segments: QuotaBarSegment[];
}

/**
 * Splits a parent quota (`limit`, null when not limited) among its children. The bar is scaled on the
 * limit, or on the allocated sum when it is greater (overcommitment) or when the parent is not limited.
 */
export function buildQuotaBar(limit: number | null, parts: QuotaBarPart[]): QuotaBar {
  const allocated = parts.reduce((acc, p) => acc + (p.value ?? 0), 0);
  const scale = Math.max(limit ?? 0, allocated);
  const percent = (v: number) => (scale > 0 ? (v / scale) * 100 : 0);
  const free = limit === null ? null : Math.max(limit - allocated, 0);

  return {
    limit,
    allocated,
    free,
    freePercent: free === null ? 0 : percent(free),
    overcommitted: limit !== null && allocated > limit,
    segments: parts.map((p, i) => ({
      ...p,
      percent: percent(p.value ?? 0),
      share: limit && p.value !== null ? (p.value / limit) * 100 : null,
      colorIndex: i,
    })),
  };
}

/** Value of `resource` in `resources`, null when not limited. */
export function quotaValue(resources: QuotaResources | undefined | null, resource: QuotaResourceEnum): number | null {
  return parseQuotaQuantity(resource, resources?.[resource]);
}

/**
 * Enforced value of `resource` for a child (same as the API): its own value, or 0 when the parent limits
 * the resource (`parentLimit` not null) and the child does not. null when not limited.
 */
export function enforcedQuotaValue(
  resources: QuotaResources | undefined | null,
  resource: QuotaResourceEnum,
  parentLimit: number | null
): number | null {
  const value = quotaValue(resources, resource);
  if (value !== null) {
    return value;
  }
  return parentLimit !== null ? 0 : null;
}
