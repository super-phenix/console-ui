import { BinaryUnit, bytesPerUnit, guestMemory, parseQuantityToBytes, splitQuantity } from './quantity';

describe('parseQuantityToBytes', () => {
  const cases: { name: string; value: string; expected: number | null }[] = [
    { name: 'plain number', value: '500', expected: 500 },
    { name: 'Ki', value: '1Ki', expected: 1024 },
    { name: 'fractional Gi', value: '1.5Gi', expected: 1.5 * 2 ** 30 },
    { name: 'Ti', value: '1Ti', expected: 2 ** 40 },
    { name: 'arbitrary string', value: 'abc', expected: null },
    { name: 'decimal suffix rejected', value: '1G', expected: null },
    { name: 'empty', value: '', expected: null },
    { name: 'negative rejected', value: '-1Gi', expected: null },
  ];

  cases.forEach(({ name, value, expected }) => {
    it(`should return ${expected} for ${name}`, () => {
      expect(parseQuantityToBytes(value)).toEqual(expected);
    });
  });

  it('should compare quantities across units', () => {
    expect(parseQuantityToBytes('10Gi')!).toBeLessThan(parseQuantityToBytes('1Ti')!);
    expect(parseQuantityToBytes('1025Mi')!).toBeGreaterThan(parseQuantityToBytes('1Gi')!);
  });
});

describe('guestMemory', () => {
  const cases: { name: string; value: string | undefined; expected: string | null }[] = [
    { name: 'Gi', value: '4Gi', expected: '4Gi' },
    { name: 'whole GiB in Mi', value: '4096Mi', expected: '4096Mi' },
    { name: 'fractional GiB', value: '1536Mi', expected: '1536Mi' },
    { name: 'decimal suffix', value: '8G', expected: null },
    { name: 'absent', value: undefined, expected: null },
  ];

  cases.forEach(({ name, value, expected }) => {
    it(`should return ${expected} for ${name}`, () => {
      expect(guestMemory(value)).toEqual(expected);
    });
  });
});

describe('splitQuantity', () => {
  const cases: { name: string; value: string; expected: { value: number; unit: BinaryUnit } | null }[] = [
    { name: '100Gi', value: '100Gi', expected: { value: 100, unit: 'Gi' } },
    { name: '1Ti', value: '1Ti', expected: { value: 1, unit: 'Ti' } },
    { name: 'no suffix', value: '500', expected: null },
    { name: 'suffix outside form units', value: '1Pi', expected: null },
    { name: 'arbitrary string', value: 'abc', expected: null },
    { name: 'empty', value: '', expected: null },
  ];

  cases.forEach(({ name, value, expected }) => {
    it(`should return ${JSON.stringify(expected)} for ${name}`, () => {
      expect(splitQuantity(value)).toEqual(expected);
    });
  });
});

describe('bytesPerUnit', () => {
  const cases: { unit: BinaryUnit; expected: number }[] = [
    { unit: 'Ki', expected: 2 ** 10 },
    { unit: 'Mi', expected: 2 ** 20 },
    { unit: 'Gi', expected: 2 ** 30 },
    { unit: 'Ti', expected: 2 ** 40 },
  ];

  cases.forEach(({ unit, expected }) => {
    it(`should return ${expected} for ${unit}`, () => {
      expect(bytesPerUnit(unit)).toEqual(expected);
    });
  });
});
