import { QuotaResourceEnum } from '@shared/models/data/quota';
import {
  buildQuotaBar,
  formatQuotaQuantity,
  parseQuotaQuantity,
  quotaFill,
  toQuotaFormValue,
  toQuotaQuantity,
} from './quota';

const { CPU, Memory, Disk } = QuotaResourceEnum;
const GI = 2 ** 30;
const TI = 2 ** 40;

describe('parseQuotaQuantity', () => {
  const cases: { resource: QuotaResourceEnum; value: string | undefined; expected: number | null }[] = [
    { resource: CPU, value: '16', expected: 16000 },
    { resource: CPU, value: '500m', expected: 500 },
    { resource: CPU, value: '1.5', expected: 1500 },
    { resource: CPU, value: '0', expected: 0 },
    { resource: Memory, value: '64Gi', expected: 64 * GI },
    { resource: Memory, value: '1G', expected: 1e9 },
    { resource: Disk, value: '2Ti', expected: 2 * TI },
    { resource: Disk, value: '1024', expected: 1024 },
    { resource: Disk, value: undefined, expected: null },
    { resource: Disk, value: 'abc', expected: null },
    { resource: Disk, value: '-1Gi', expected: null },
  ];

  cases.forEach(({ resource, value, expected }) => {
    it(`should parse ${resource} ${value} into ${expected}`, () => {
      expect(parseQuotaQuantity(resource, value)).toEqual(expected);
    });
  });
});

describe('formatQuotaQuantity', () => {
  it('should format the CPU in vCPU', () => {
    expect(formatQuotaQuantity(CPU, 16000)).toBe('16 vCPU');
    expect(formatQuotaQuantity(CPU, 1500)).toBe('1.5 vCPU');
  });

  it('should format the bytes', () => {
    expect(formatQuotaQuantity(Memory, 64 * GI)).toBe('64 GiB');
    expect(formatQuotaQuantity(Disk, 0)).toBe('0 B');
  });
});

describe('toQuotaQuantity / toQuotaFormValue', () => {
  it('should build CPU quantities', () => {
    expect(toQuotaQuantity(CPU, 4)).toBe('4');
    expect(toQuotaQuantity(CPU, 0.5)).toBe('500m');
  });

  it('should build byte quantities', () => {
    expect(toQuotaQuantity(Memory, 64, 'Gi')).toBe('64Gi');
    expect(toQuotaQuantity(Disk, 2, 'Ti')).toBe('2Ti');
  });

  it('should round-trip through the form value', () => {
    expect(toQuotaFormValue(CPU, 1500)).toEqual({ value: 1.5 });
    expect(toQuotaFormValue(Memory, 64 * GI)).toEqual({ value: 64, unit: 'Gi' });
    expect(toQuotaFormValue(Disk, 2 * TI)).toEqual({ value: 2, unit: 'Ti' });
    expect(toQuotaFormValue(Disk, 0)).toEqual({ value: 0, unit: 'Gi' });
  });
});

describe('buildQuotaBar', () => {
  it('should split a limit among its children', () => {
    const bar = buildQuotaBar(100, [
      { key: 'a', label: 'A', value: 25 },
      { key: 'b', label: 'B', value: 50 },
    ]);
    expect(bar.allocated).toBe(75);
    expect(bar.free).toBe(25);
    expect(bar.freePercent).toBe(25);
    expect(bar.overcommitted).toBeFalse();
    expect(bar.segments.map(s => s.percent)).toEqual([25, 50]);
    expect(bar.segments.map(s => s.share)).toEqual([25, 50]);
  });

  it('should scale on the allocated sum when overcommitted', () => {
    const bar = buildQuotaBar(100, [
      { key: 'a', label: 'A', value: 100 },
      { key: 'b', label: 'B', value: 100 },
    ]);
    expect(bar.overcommitted).toBeTrue();
    expect(bar.free).toBe(0);
    expect(bar.segments.map(s => s.percent)).toEqual([50, 50]);
  });

  it('should handle an unlimited parent and unlimited children', () => {
    const bar = buildQuotaBar(null, [
      { key: 'a', label: 'A', value: 30 },
      { key: 'b', label: 'B', value: null },
    ]);
    expect(bar.allocated).toBe(30);
    expect(bar.free).toBeNull();
    expect(bar.overcommitted).toBeFalse();
    expect(bar.segments.map(s => s.percent)).toEqual([100, 0]);
    expect(bar.segments.map(s => s.share)).toEqual([null, null]);
  });

  it('should not divide by zero', () => {
    const bar = buildQuotaBar(0, [{ key: 'a', label: 'A', value: 0 }]);
    expect(bar.segments[0].percent).toBe(0);
    expect(bar.freePercent).toBe(0);
  });
});

describe('quotaFill', () => {
  it('should format normal consumption vs limit', () => {
    const fill = quotaFill(CPU, 2000, 4000);
    expect(fill).toEqual({
      text: '2 vCPU / 4 vCPU',
      percent: 50,
      meter: 50,
      full: false,
      unavailable: false,
    });
  });

  it('should flag full or overcommitted allocations', () => {
    const fill = quotaFill(Memory, 25 * GI, 20 * GI);
    expect(fill).toEqual({
      text: '25 GiB / 20 GiB',
      percent: 125,
      meter: 100,
      full: true,
      unavailable: false,
    });
  });

  it('should handle zero allocation and zero usage as Nothing allocated', () => {
    const fill = quotaFill(CPU, 0, 0);
    expect(fill).toEqual({
      text: 'Nothing allocated',
      percent: null,
      meter: 0,
      full: false,
      nothingAllocated: true,
      unavailable: false,
    });
  });

  it('should handle unavailable usage', () => {
    const fill = quotaFill(CPU, null, 4000);
    expect(fill).toEqual({
      text: 'Usage unavailable',
      percent: null,
      meter: 0,
      full: false,
      unavailable: true,
    });
  });

  it('should handle unlimited resources', () => {
    expect(quotaFill(Disk, undefined, null)).toEqual({
      text: '∞',
      percent: null,
      meter: 0,
      full: false,
      unavailable: false,
    });
    expect(quotaFill(Disk, 10 * GI, null)).toEqual({
      text: '10 GiB / ∞',
      percent: null,
      meter: 0,
      full: false,
      unavailable: false,
    });
  });

  it('should handle loading state with limit', () => {
    expect(quotaFill(CPU, undefined, 4000)).toEqual({
      text: '4 vCPU allocated',
      percent: null,
      meter: 0,
      full: false,
      unavailable: false,
    });
  });
});
