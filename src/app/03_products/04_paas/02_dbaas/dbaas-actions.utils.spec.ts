import { DBaaSEndpoint, PostgresCluster } from '@products/00_shared/models/paas/dbaas/dbaas.model';
import {
  cpuCores,
  dbaasPhaseChip,
  formatAmount,
  memoryGiB,
  privateEndpoints,
  publicEndpoints,
  sortEndpoints,
} from './dbaas-actions.utils';

function cluster(phase?: string): PostgresCluster {
  return {
    metadata: { name: 'db', namespace: 'ns' },
    spec: {},
    status: { phase },
  };
}

describe('dbaasPhaseChip', () => {
  const cases: { name: string; cluster: PostgresCluster | null; cls: string; label: string }[] = [
    { name: 'no cluster yet', cluster: null, cls: 'status-chip--pending', label: 'Provisioning' },
    { name: 'healthy', cluster: cluster('Cluster in healthy state'), cls: 'status-chip--ready', label: 'Ready' },
    { name: 'empty phase', cluster: cluster(undefined), cls: 'status-chip--pending', label: 'Provisioning' },
    { name: 'first primary', cluster: cluster('Setting up primary'), cls: 'status-chip--pending', label: 'Provisioning' },
    { name: 'new replica', cluster: cluster('Creating a new replica'), cls: 'status-chip--pending', label: 'Adding replica' },
    { name: 'failover', cluster: cluster('Failing over'), cls: 'status-chip--warning', label: 'Failing over' },
    { name: 'switchover', cluster: cluster('Switchover in progress'), cls: 'status-chip--warning', label: 'Failing over' },
    {
      name: 'in-place restart',
      cluster: cluster('Primary instance is being restarted in-place'),
      cls: 'status-chip--pending',
      label: 'Restarting',
    },
    {
      name: 'unrecoverable',
      cluster: cluster('Unable to create required cluster objects'),
      cls: 'status-chip--error',
      label: 'Needs attention',
    },
    { name: 'user action', cluster: cluster('Waiting for user action'), cls: 'status-chip--error', label: 'Needs attention' },
    { name: 'upgrade', cluster: cluster('Upgrading cluster'), cls: 'status-chip--pending', label: 'Updating' },
  ];

  cases.forEach(({ name, cluster, cls, label }) => {
    it(`maps ${name}`, () => {
      const chip = dbaasPhaseChip(cluster);
      expect(chip.cls).toBe(cls);
      expect(chip.label).toBe(label);
    });
  });

  it('keeps the phase reason in the title', () => {
    const c = cluster('Upgrading cluster');
    c.status.phaseReason = 'resources changed';
    expect(dbaasPhaseChip(c).title).toBe('Upgrading cluster: resources changed');
  });
});

describe('sortEndpoints', () => {
  it('puts rw first, then ro, then r', () => {
    const sorted = sortEndpoints([
      { role: 'r', host: 'h', port: 5434 },
      { role: 'rw', host: 'h', port: 5432 },
      { role: 'ro', host: 'h', port: 5433 },
    ]);
    expect(sorted.map(e => e.role)).toEqual(['rw', 'ro', 'r']);
  });

  it('handles a missing list', () => {
    expect(sortEndpoints(null)).toEqual([]);
  });
});

describe('private and public endpoints', () => {
  const vip = '198.18.0.10';
  const eip = '51.159.24.88';
  const mixed: DBaaSEndpoint[] = [
    { role: 'r', host: vip, port: 5434 },
    { role: 'rw', host: vip, port: 5432 },
    { role: 'r', host: eip, port: 5434, external: true },
    { role: 'rw', host: eip, port: 5432, external: true },
  ];
  const cases: {
    name: string;
    split: (endpoints?: DBaaSEndpoint[] | null) => DBaaSEndpoint[];
    endpoints: DBaaSEndpoint[] | null;
    hosts: string[];
  }[] = [
    { name: 'private of a mixed list', split: privateEndpoints, endpoints: mixed, hosts: [vip, vip] },
    { name: 'public of a mixed list', split: publicEndpoints, endpoints: mixed, hosts: [eip, eip] },
    { name: 'public without external access', split: publicEndpoints, endpoints: mixed.slice(0, 2), hosts: [] },
    { name: 'private of a missing list', split: privateEndpoints, endpoints: null, hosts: [] },
  ];

  cases.forEach(({ name, split, endpoints, hosts }) => {
    it(name, () => {
      const result = split(endpoints);
      expect(result.map(e => e.host)).toEqual(hosts);
      expect(result.map(e => e.role)).toEqual(hosts.length ? ['rw', 'r'] : []);
    });
  });
});

describe('quantities', () => {
  const cases: { name: string; parse: (v?: string) => number | undefined; value?: string; expected?: number }[] = [
    { name: 'whole cores', parse: cpuCores, value: '4', expected: 4 },
    { name: 'millicores', parse: cpuCores, value: '1500m', expected: 1.5 },
    { name: 'missing cpu', parse: cpuCores, value: undefined, expected: undefined },
    { name: 'unknown cpu suffix', parse: cpuCores, value: '2x', expected: undefined },
    { name: 'GiB', parse: memoryGiB, value: '4Gi', expected: 4 },
    { name: 'MiB', parse: memoryGiB, value: '512Mi', expected: 0.5 },
    { name: 'TiB', parse: memoryGiB, value: '1Ti', expected: 1024 },
    { name: 'plain bytes', parse: memoryGiB, value: '4096', expected: undefined },
  ];

  cases.forEach(({ name, parse, value, expected }) => {
    it(`parses ${name}`, () => {
      expect(parse(value)).toBe(expected);
    });
  });

  it('formats amounts without trailing zeros', () => {
    expect([6, 1.5, 0.333, 12.0].map(formatAmount)).toEqual(['6', '1.5', '0.33', '12']);
  });
});
