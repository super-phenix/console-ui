import { CidrForVersion, CidrNetworkAddress, IsValidIPv4 } from './ip';

describe('IsValidIPv4', () => {
  const cases: { name: string; value: string; expected: boolean }[] = [
    { name: 'standard private IPv4', value: '10.0.0.1', expected: true },
    { name: 'max octets', value: '255.255.255.255', expected: true },
    { name: 'virtual ip range edge', value: '198.18.0.255', expected: true },
    { name: 'octet out of range', value: '256.0.0.1', expected: false },
    { name: 'too few octets', value: '1.2.3', expected: false },
    { name: 'too many octets', value: '1.2.3.4.5', expected: false },
    { name: 'IPv6 loopback rejected', value: '::1', expected: false },
    { name: 'IPv6 link-local rejected', value: 'fe80::1', expected: false },
    { name: 'arbitrary string', value: 'abc', expected: false },
    { name: 'empty string', value: '', expected: false },
  ];

  cases.forEach(({ name, value, expected }) => {
    it(`should return ${expected} for ${name} ("${value}")`, () => {
      expect(IsValidIPv4(value)).toBe(expected);
    });
  });
});

describe('CidrForVersion', () => {
  const cases: { name: string; cidr: string; version: 4 | 6; expected: string | undefined }[] = [
    { name: 'v4-only, asking v4', cidr: '10.0.0.0/24', version: 4, expected: '10.0.0.0/24' },
    { name: 'v4-only, asking v6', cidr: '10.0.0.0/24', version: 6, expected: undefined },
    { name: 'v6-only, asking v6', cidr: '2001:db8::/64', version: 6, expected: '2001:db8::/64' },
    { name: 'v6-only, asking v4', cidr: '2001:db8::/64', version: 4, expected: undefined },
    { name: 'dual, asking v4', cidr: '10.0.0.0/24,2001:db8::/64', version: 4, expected: '10.0.0.0/24' },
    { name: 'dual, asking v6', cidr: '10.0.0.0/24,2001:db8::/64', version: 6, expected: '2001:db8::/64' },
    { name: 'dual with spaces, asking v6', cidr: '10.0.0.0/24, 2001:db8::/64', version: 6, expected: '2001:db8::/64' },
  ];

  cases.forEach(({ name, cidr, version, expected }) => {
    it(`should return ${expected} for ${name}`, () => {
      expect(CidrForVersion(cidr, version)).toBe(expected);
    });
  });
});

describe('CidrNetworkAddress', () => {
  const cases: { name: string; cidr: string; expected: string }[] = [
    { name: 'IPv4 cidr', cidr: '10.0.0.0/24', expected: '10.0.0.0' },
    { name: 'IPv6 cidr', cidr: '2001:db8::/64', expected: '2001:db8::' },
    { name: 'cidr with surrounding spaces', cidr: ' 192.168.1.0/16 ', expected: '192.168.1.0' },
  ];

  cases.forEach(({ name, cidr, expected }) => {
    it(`should return ${expected} for ${name}`, () => {
      expect(CidrNetworkAddress(cidr)).toBe(expected);
    });
  });
});
