// Kubernetes binary quantities ("100Gi", "1Ti"...) as used by the S3 bucket size caps.

export const BINARY_UNITS = ['Ki', 'Mi', 'Gi', 'Ti'] as const;
export type BinaryUnit = (typeof BINARY_UNITS)[number];

const QUANTITY_REGEX = /^(\d+(?:\.\d+)?)(Ki|Mi|Gi|Ti|Pi|Ei)?$/;

const MULTIPLIERS: Record<string, number> = {
  Ki: 2 ** 10,
  Mi: 2 ** 20,
  Gi: 2 ** 30,
  Ti: 2 ** 40,
  Pi: 2 ** 50,
  Ei: 2 ** 60,
};

// Parses "500", "1.5Gi" or "1Ti" into bytes; null when unparseable.
export function parseQuantityToBytes(quantity: string): number | null {
  const match = QUANTITY_REGEX.exec(quantity);
  if (!match) {
    return null;
  }
  const value = parseFloat(match[1]);
  const multiplier = match[2] ? MULTIPLIERS[match[2]] : 1;
  return value * multiplier;
}

// Splits "100Gi" into {value: 100, unit: 'Gi'} for form prefill; null when the
// quantity has no suffix or one outside BINARY_UNITS.
export function splitQuantity(quantity: string): { value: number; unit: BinaryUnit } | null {
  const match = QUANTITY_REGEX.exec(quantity);
  if (!match || !match[2] || !(BINARY_UNITS as readonly string[]).includes(match[2])) {
    return null;
  }
  return { value: parseFloat(match[1]), unit: match[2] as BinaryUnit };
}
