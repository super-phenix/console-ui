import { APP_NAME_CLUSTER_LABEL_VALUE, APP_NAME_LABEL_KEY } from '@shared/models/consts';

export function isClusterResource(labels?: Record<string, string>): boolean {
  if (!labels) {
    return false;
  }
  return labels[APP_NAME_LABEL_KEY] === APP_NAME_CLUSTER_LABEL_VALUE;
}

// Default values
const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const DEFAULT_LENGTH = 8;

/**
 * generateShortId returns a Short Id encoded in base58
 */
export function generateShortId(): string {
  // Generate a random string
  const randomStr = generateRandomString(DEFAULT_LENGTH, DEFAULT_CHARSET);
  return randomStr;
}

/**
 * isVersionAtLeast compares a "major.minor[.patch]" version string against a
 * minimum major.minor. Tolerates a leading "v" prefix (e.g. "v1.35.5").
 * Returns false for empty or unparsable versions.
 */
export function isVersionAtLeast(version: string | undefined | null, minMajor: number, minMinor: number): boolean {
  if (!version) {
    return false;
  }
  const [major, minor] = version.replace(/^v/i, '').split('.').map(p => parseInt(p, 10));
  if (Number.isNaN(major) || Number.isNaN(minor)) {
    return false;
  }
  return major > minMajor || (major === minMajor && minor >= minMinor);
}

function generateRandomString(length: number, charset: string): string {
  let result = '';
  const charsetLength = charset.length;
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charsetLength));
  }
  return result;
}
