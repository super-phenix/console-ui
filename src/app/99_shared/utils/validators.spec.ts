import { FormControl, ValidationErrors } from '@angular/forms';
import { ipInCidrValidator, ipv4Validator, jsonValidator, maxMinifiedLength } from './validators';

describe('ipv4Validator', () => {
  const validate = (value: string): ValidationErrors | null => ipv4Validator()(new FormControl(value));

  const cases: { name: string; value: string; expected: ValidationErrors | null }[] = [
    { name: 'valid IPv4', value: '10.0.0.1', expected: null },
    { name: 'valid IPv4 max octets', value: '255.255.255.255', expected: null },
    { name: 'empty value (required owns emptiness)', value: '', expected: null },
    { name: 'IPv6 rejected', value: 'fe80::1', expected: { ipv4: true } },
    { name: 'octet out of range', value: '256.0.0.1', expected: { ipv4: true } },
    { name: 'arbitrary string', value: 'not-an-ip', expected: { ipv4: true } },
  ];

  cases.forEach(({ name, value, expected }) => {
    it(`should return ${JSON.stringify(expected)} for ${name}`, () => {
      expect(validate(value)).toEqual(expected);
    });
  });
});

describe('ipInCidrValidator', () => {
  const validate = (cidr: string | undefined, value: string): ValidationErrors | null =>
    ipInCidrValidator(cidr)(new FormControl(value));

  const cases: { name: string; cidr: string | undefined; value: string; expected: ValidationErrors | null }[] = [
    { name: 'empty value (required owns emptiness)', cidr: '10.0.0.0/24', value: '', expected: null },
    { name: 'no cidr (nothing to check against)', cidr: undefined, value: '10.0.0.5', expected: null },
    { name: 'in-range IPv4', cidr: '10.0.0.0/24', value: '10.0.0.5', expected: null },
    { name: 'out-of-range IPv4', cidr: '10.0.0.0/24', value: '192.168.1.5', expected: { ipRange: true } },
    { name: 'in-range IPv6', cidr: '2001:db8::/64', value: '2001:db8::1', expected: null },
    { name: 'out-of-range IPv6', cidr: '2001:db8::/64', value: '2001:dead::1', expected: { ipRange: true } },
    { name: 'wrong-family IP vs v4 cidr', cidr: '10.0.0.0/24', value: '2001:db8::1', expected: { ipRange: true } },
  ];

  cases.forEach(({ name, cidr, value, expected }) => {
    it(`should return ${JSON.stringify(expected)} for ${name}`, () => {
      expect(validate(cidr, value)).toEqual(expected);
    });
  });
});

describe('jsonValidator', () => {
  const validate = (value: string): ValidationErrors | null => jsonValidator()(new FormControl(value));

  const cases: { name: string; value: string; expected: ValidationErrors | null }[] = [
    { name: 'empty value (required owns emptiness)', value: '', expected: null },
    { name: 'valid object', value: '{"Version": "2012-10-17"}', expected: null },
    { name: 'valid array', value: '[1, 2, 3]', expected: null },
    { name: 'pretty-printed object', value: '{\n  "a": "b"\n}', expected: null },
    { name: 'trailing comma', value: '{"a": 1,}', expected: { json: true } },
    { name: 'plain string', value: 'not-json', expected: { json: true } },
    { name: 'unterminated object', value: '{"a":', expected: { json: true } },
  ];

  cases.forEach(({ name, value, expected }) => {
    it(`should return ${JSON.stringify(expected)} for ${name}`, () => {
      expect(validate(value)).toEqual(expected);
    });
  });
});

describe('maxMinifiedLength', () => {
  const validate = (max: number, value: string): ValidationErrors | null =>
    maxMinifiedLength(max)(new FormControl(value));

  // {"a":"..."} weighs 8 chars plus the value length
  const exactly1000 = `{"a":"${'x'.repeat(992)}"}`;
  const over1000 = `{"a":"${'x'.repeat(993)}"}`;
  // whitespace-heavy document that only fits once minified
  const whitespaceHeavy = `{${' '.repeat(2000)}"a":  "b"  }`;

  const cases: { name: string; max: number; value: string; expected: ValidationErrors | null }[] = [
    { name: 'empty value (required owns emptiness)', max: 1000, value: '', expected: null },
    { name: 'unparseable value (jsonValidator owns validity)', max: 1000, value: 'not-json', expected: null },
    { name: 'exactly at the limit', max: 1000, value: exactly1000, expected: null },
    {
      name: 'over the limit',
      max: 1000,
      value: over1000,
      expected: { maxMinifiedLength: { max: 1000, actual: 1001 } },
    },
    { name: 'fits only after minification', max: 1000, value: whitespaceHeavy, expected: null },
  ];

  cases.forEach(({ name, max, value, expected }) => {
    it(`should return ${JSON.stringify(expected)} for ${name}`, () => {
      expect(validate(max, value)).toEqual(expected);
    });
  });
});
