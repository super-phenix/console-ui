import {
  CidrForVersion,
  CidrOverlaps,
  CidrNetworkAddress,
  GenerateRandomMac,
  IsValidIPv4,
  IsValidMac,
  OverlappedRanges,
} from './ip';

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

describe('IsValidMac', () => {
  const cases: { name: string; value: string; expected: boolean }[] = [
    { name: 'valid colon-delimited MAC', value: '52:54:00:11:22:33', expected: true },
    { name: 'hyphen-delimited MAC rejected', value: '52-54-00-11-22-33', expected: false },
    { name: 'valid lowercase MAC', value: '52:54:00:ab:cd:ef', expected: true },
    { name: 'valid uppercase MAC', value: '52:54:00:AB:CD:EF', expected: true },
    { name: 'too few octets', value: '52:54:00:11:22', expected: false },
    { name: 'too many octets', value: '52:54:00:11:22:33:44', expected: false },
    { name: 'non-hex characters', value: '52:54:00:11:22:zz', expected: false },
    { name: 'arbitrary string', value: 'not-a-mac', expected: false },
    { name: 'empty string', value: '', expected: false },
  ];

  cases.forEach(({ name, value, expected }) => {
    it(`should return ${expected} for ${name} ("${value}")`, () => {
      expect(IsValidMac(value)).toBe(expected);
    });
  });
});

describe('GenerateRandomMac', () => {
  it('should generate a valid MAC address with default prefix', () => {
    const mac = GenerateRandomMac();
    expect(IsValidMac(mac)).toBeTrue();
    expect(mac.startsWith('52:54:00:')).toBeTrue();
    expect(mac.split(':').length).toBe(6);
  });

  it('should support custom prefix', () => {
    const mac = GenerateRandomMac('00:16:3e');
    expect(IsValidMac(mac)).toBeTrue();
    expect(mac.startsWith('00:16:3e:')).toBeTrue();
  });

  it('should generate different MAC addresses on consecutive calls', () => {
    const mac1 = GenerateRandomMac();
    const mac2 = GenerateRandomMac();
    expect(mac1).not.toEqual(mac2);
  });
});

describe('CidrOverlaps', () => {
  const cases: { name: string; a: string; b: string; expected: boolean }[] = [
    { name: 'subnet inside a larger range', a: '10.10.0.0/16', b: '10.0.0.0/12', expected: true },
    { name: 'range containing the other (reversed)', a: '10.0.0.0/12', b: '10.10.0.0/16', expected: true },
    { name: 'identical ranges', a: '10.96.0.0/16', b: '10.96.0.0/16', expected: true },
    { name: 'non-canonical host bits', a: '10.5.4.3/16', b: '10.0.0.0/12', expected: true },
    { name: 'adjacent but disjoint', a: '10.16.0.0/16', b: '10.0.0.0/12', expected: false },
    { name: 'new default range', a: '10.32.0.0/16', b: '10.0.0.0/12', expected: false },
    { name: 'unrelated private range', a: '192.168.0.0/24', b: '10.96.0.0/16', expected: false },
    { name: 'IPv6 inside range', a: 'fd00:100::/64', b: 'fd00:100::/96', expected: true },
    { name: 'IPv6 disjoint', a: 'fd00:10:32::/64', b: 'fd00:100::/96', expected: false },
    { name: 'IPv4 vs IPv6', a: '10.0.0.0/8', b: 'fd00:100::/96', expected: false },
    { name: 'missing prefix', a: '10.0.0.0', b: '10.0.0.0/12', expected: false },
    { name: 'empty prefix while typing', a: '10.0.0.0/', b: '10.0.0.0/12', expected: false },
    { name: 'prefix too large', a: '10.0.0.0/33', b: '10.0.0.0/12', expected: false },
    { name: 'invalid IP', a: '10.0.0.999/16', b: '10.0.0.0/12', expected: false },
    { name: 'empty string', a: '', b: '10.0.0.0/12', expected: false },
    { name: 'IPv6 service range', a: 'fd00:100:ffff::/120', b: 'fd00:100:ffff::/112', expected: true },
    { name: 'uppercase hex', a: 'FD00:100::/64', b: 'fd00:100::/96', expected: true },
    { name: 'whole IPv4 space', a: '0.0.0.0/0', b: '10.96.0.0/16', expected: true },
    { name: 'surrounding whitespace', a: ' 10.10.0.0/16 ', b: '10.0.0.0/12', expected: true },
    { name: 'IPv4-mapped IPv6 is ignored', a: '::ffff:10.0.0.0/4', b: '10.0.0.0/12', expected: false },
  ];

  cases.forEach(({ name, a, b, expected }) => {
    it(`should return ${expected} for ${name} ("${a}" vs "${b}")`, () => {
      expect(CidrOverlaps(a, b)).toBe(expected);
    });
  });
});

describe('OverlappedRanges', () => {
  const ranges = [
    { name: 'pod', cidr: '10.0.0.0/12' },
    { name: 'pod', cidr: 'fd00:100::/96' },
    { name: 'service', cidr: '10.96.0.0/16' },
    { name: 'service', cidr: 'fd00:100:ffff::/112' },
  ];
  const cases: { name: string; cidrs: string; expected: string[] }[] = [
    { name: 'single non-overlapping IPv4', cidrs: '192.168.0.0/24', expected: [] },
    { name: 'single overlapping IPv4', cidrs: '10.10.0.0/16', expected: ['10.0.0.0/12'] },
    { name: 'IPv4 covering both ranges', cidrs: '10.0.0.0/8', expected: ['10.0.0.0/12', '10.96.0.0/16'] },
    { name: 'single overlapping IPv6', cidrs: 'fd00:100::/64', expected: ['fd00:100::/96'] },
    { name: 'IPv6 covering both ranges', cidrs: 'fd00:100::/32', expected: ['fd00:100::/96', 'fd00:100:ffff::/112'] },
    { name: 'dual-stack, IPv4 overlapping only', cidrs: '10.96.0.0/24,fd00:10:32::/64', expected: ['10.96.0.0/16'] },
    { name: 'dual-stack, IPv6 overlapping only', cidrs: '192.168.0.0/24,fd00:100::/120', expected: ['fd00:100::/96'] },
    {
      name: 'dual-stack with spaces, both overlapping',
      cidrs: ' 10.0.0.0/24 , fd00:100:ffff::/120 ',
      expected: ['10.0.0.0/12', 'fd00:100:ffff::/112'],
    },
    { name: 'dual-stack, none overlapping', cidrs: '192.168.0.0/24,fd00:10:32::/64', expected: [] },
    { name: 'empty string', cidrs: '', expected: [] },
    { name: 'trailing comma', cidrs: '10.10.0.0/16,', expected: ['10.0.0.0/12'] },
    { name: 'invalid entry', cidrs: 'abc,10.0.0.999/16', expected: [] },
  ];

  cases.forEach(({ name, cidrs, expected }) => {
    it(`should return [${expected.join(', ')}] for ${name} ("${cidrs}")`, () => {
      expect(OverlappedRanges(cidrs, ranges).map(r => r.cidr)).toEqual(expected);
    });
  });

  it('should not match a dual-stack string with CidrOverlaps directly', () => {
    expect(CidrOverlaps('10.10.0.0/16,fd00:10:32::/64', '10.0.0.0/12')).toBe(false);
  });
});
