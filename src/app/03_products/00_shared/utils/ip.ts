const ipv4Regex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const ipv6Regex =
  /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

// Check if an ip is a valid IPv4 address
// Return true if it's valid, false otherwise
export function IsValidIPv4(ip: string): boolean {
  return ipv4Regex.test(ip);
}

// Check if an ip is a valid IP address (IPv4 or IPv6)
// Return true is it's valid, false otherwise
export function IsValidIp(ip: string): boolean {
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Return the entry of a (possibly comma-separated) CIDR matching the IP version
export function CidrForVersion(cidr: string, version: 4 | 6): string | undefined {
  return cidr
    .split(',')
    .map(c => c.trim())
    .find(c => (version === 4 ? c.includes('.') : c.includes(':')));
}

// Network address part of a CIDR (strip the /prefix), used as input placeholder
export function CidrNetworkAddress(cidr: string): string {
  return cidr.split('/')[0].trim();
}

// Check if a IP is contains by the CIDR range (can be a comma-separated list of ranges)
// Return true is it's inside, false otherwise
export function IsIPinRange(range: string, ip: string): boolean {
  if (!IsValidIp(ip)) {
    return false;
  }

  const ranges = range.split(',').map(r => r.trim());

  return ranges.some(r => {
    if (!r.includes('/')) {
      return false;
    }

    const [rangeIp, prefixStr] = r.split('/');
    const prefix = parseInt(prefixStr, 10);

    if (!IsValidIp(rangeIp)) {
      return false;
    }

    const isIpv4 = ip.includes('.');
    const isRangeIpv4 = rangeIp.includes('.');
    if (isIpv4 !== isRangeIpv4) {
      return false;
    }

    if (isIpv4) {
      const ipToUint32 = (addr: string) =>
        addr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;

      const ipInt = ipToUint32(ip);
      const rangeInt = ipToUint32(rangeIp);

      const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;

      return (ipInt & mask) === (rangeInt & mask);
    } else {
      const ipv6ToBigInt = (addr: string) => {
        let fullAddr = addr;
        if (addr.includes('::')) {
          const parts = addr.split('::');
          const left = parts[0].split(':').filter(s => s !== '');
          const right = parts[1].split(':').filter(s => s !== '');
          const middle = Array(8 - (left.length + right.length)).fill('0');
          fullAddr = [...left, ...middle, ...right].join(':');
        }
        const parts = fullAddr.split(':');
        if (parts.length !== 8) {
          // Handle cases where :: was at the beginning or end and created empty strings
          const filtered = parts.filter(s => s !== '');
          while (filtered.length < 8) filtered.push('0');
          return filtered.reduce((acc, part) => (acc << 16n) + BigInt(parseInt(part, 16)), 0n);
        }
        return parts.reduce((acc, part) => (acc << 16n) + BigInt(parseInt(part || '0', 16)), 0n);
      };

      try {
        const ipInt = ipv6ToBigInt(ip);
        const rangeInt = ipv6ToBigInt(rangeIp);
        const mask = prefix === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - prefix)) - 1n);

        return (ipInt & mask) === (rangeInt & mask);
      } catch {
        return false;
      }
    }
  });
}
