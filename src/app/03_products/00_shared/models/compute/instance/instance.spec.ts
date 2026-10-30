import { FormControl } from '@angular/forms';
import {
  BUS_AUTO,
  BUS_LIST,
  BUS_SATA,
  BUS_VIRTIO,
  CreateInstanceNetwork,
  getBusName,
  memoryQuantityValidator,
} from './instance';
import { InterfaceElement, VirtualMachineInstanceNetworkInterface } from './vmi.model';

describe('Instance BUS constants and helpers', () => {
  describe('BUS constants', () => {
    it('should define BUS_AUTO with correct value and display name', () => {
      expect(BUS_AUTO).toEqual({ value: 'auto', name: 'Auto' });
    });

    it('should define BUS_SATA with correct value and display name', () => {
      expect(BUS_SATA).toEqual({ value: 'sata', name: 'SATA' });
    });

    it('should define BUS_VIRTIO with correct value and display name', () => {
      expect(BUS_VIRTIO).toEqual({ value: 'virtio', name: 'VirtIO' });
    });

    it('should contain all bus constants in BUS_LIST', () => {
      expect(BUS_LIST).toEqual([BUS_AUTO, BUS_SATA, BUS_VIRTIO]);
      expect(BUS_LIST.length).toBe(3);
    });
  });

  describe('getBusName', () => {
    it('should return the display name for known bus values', () => {
      expect(getBusName('auto')).toBe('Auto');
      expect(getBusName('sata')).toBe('SATA');
      expect(getBusName('virtio')).toBe('VirtIO');
    });

    it('should return the original value when unknown bus value is provided', () => {
      expect(getBusName('scsi')).toBe('scsi');
      expect(getBusName('ide')).toBe('ide');
    });

    it('should handle undefined, null, or empty string gracefully', () => {
      expect(getBusName(undefined)).toBe('');
      expect(getBusName(null)).toBe('');
      expect(getBusName('')).toBe('');
    });
  });

  describe('CreateInstanceNetwork model', () => {
    it('should accept enabled: true', () => {
      const net: CreateInstanceNetwork = {
        order: 0,
        subnetEId: 'subnet-123',
        model: 'virtio',
        enabled: true,
        ipv4: '10.0.0.5',
      };
      expect(net.enabled).toBeTrue();
    });

    it('should accept enabled: false', () => {
      const net: CreateInstanceNetwork = {
        order: 1,
        subnetEId: 'subnet-456',
        model: 'auto',
        enabled: false,
      };
      expect(net.enabled).toBeFalse();
    });

    it('should allow omitting enabled for backward compatibility', () => {
      const net: CreateInstanceNetwork = {
        order: 0,
        subnetEId: 'subnet-789',
      };
      expect(net.enabled).toBeUndefined();
    });

    it('should correctly serialize and deserialize enabled field in JSON', () => {
      const netTrue: CreateInstanceNetwork = { order: 0, subnetEId: 'sub-1', enabled: true };
      const netFalse: CreateInstanceNetwork = { order: 1, subnetEId: 'sub-2', enabled: false };
      const netOmitted: CreateInstanceNetwork = { order: 2, subnetEId: 'sub-3' };

      const parsedTrue = JSON.parse(JSON.stringify(netTrue)) as CreateInstanceNetwork;
      const parsedFalse = JSON.parse(JSON.stringify(netFalse)) as CreateInstanceNetwork;
      const parsedOmitted = JSON.parse(JSON.stringify(netOmitted)) as CreateInstanceNetwork;

      expect(parsedTrue.enabled).toBeTrue();
      expect(parsedFalse.enabled).toBeFalse();
      expect(parsedOmitted.enabled).toBeUndefined();
      expect('enabled' in parsedOmitted).toBeFalse();
    });

    it('should accept macAddress', () => {
      const net: CreateInstanceNetwork = {
        order: 0,
        subnetEId: 'subnet-123',
        macAddress: '52:54:00:11:22:33',
      };
      expect(net.macAddress).toBe('52:54:00:11:22:33');
    });

    it('should allow omitting macAddress for backward compatibility', () => {
      const net: CreateInstanceNetwork = {
        order: 0,
        subnetEId: 'subnet-789',
      };
      expect(net.macAddress).toBeUndefined();
    });

    it('should correctly serialize and deserialize macAddress in JSON', () => {
      const netWithMac: CreateInstanceNetwork = {
        order: 0,
        subnetEId: 'sub-1',
        macAddress: '52:54:00:aa:bb:cc',
      };
      const netWithoutMac: CreateInstanceNetwork = { order: 1, subnetEId: 'sub-2' };

      const parsedWith = JSON.parse(JSON.stringify(netWithMac)) as CreateInstanceNetwork;
      const parsedWithout = JSON.parse(JSON.stringify(netWithoutMac)) as CreateInstanceNetwork;

      expect(parsedWith.macAddress).toBe('52:54:00:aa:bb:cc');
      expect(parsedWithout.macAddress).toBeUndefined();
      expect('macAddress' in parsedWithout).toBeFalse();
    });
  });

  describe('VM and VMI interface state types', () => {
    it('should type InterfaceElement with state and macAddress', () => {
      const ifaceUp: InterfaceElement = { name: 'interface-0', state: 'up', macAddress: '52:54:00:11:22:33' };
      const ifaceDown: InterfaceElement = { name: 'interface-1', state: 'down' };
      const ifaceDefault: InterfaceElement = { name: 'interface-2' };

      expect(ifaceUp.state).toBe('up');
      expect(ifaceUp.macAddress).toBe('52:54:00:11:22:33');
      expect(ifaceDown.state).toBe('down');
      expect(ifaceDown.macAddress).toBeUndefined();
      expect(ifaceDefault.state).toBeUndefined();
      expect(ifaceDefault.macAddress).toBeUndefined();
    });

    it('should type VirtualMachineInstanceNetworkInterface linkState as up or down', () => {
      const vmiIfaceUp: VirtualMachineInstanceNetworkInterface = {
        name: 'interface-0',
        mac: '52:54:00:12:34:56',
        linkState: 'up',
      };
      const vmiIfaceDown: VirtualMachineInstanceNetworkInterface = {
        name: 'interface-1',
        linkState: 'down',
      };

      expect(vmiIfaceUp.linkState).toBe('up');
      expect(vmiIfaceDown.linkState).toBe('down');
    });
  });
});

describe('memoryQuantityValidator', () => {
  const cases: { name: string; value: string | null; valid: boolean }[] = [
    { name: 'empty, left to required', value: null, valid: true },
    { name: 'minimum', value: '128Mi', valid: true },
    { name: 'whole GiB', value: '4Gi', valid: true },
    { name: 'fractional GiB', value: '1.5Gi', valid: true },
    { name: 'MiB not whole GiB', value: '2500Mi', valid: true },
    { name: 'maximum', value: '999999Gi', valid: true },
    { name: 'below minimum', value: '127Mi', valid: false },
    { name: 'above maximum', value: '1000000Gi', valid: false },
    { name: 'not whole MiB', value: '1.2Gi', valid: false },
    { name: 'decimal unit', value: '2G', valid: false },
    { name: 'unparseable', value: 'abc', valid: false },
  ];

  cases.forEach(({ name, value, valid }) => {
    it(`should ${valid ? 'accept' : 'reject'} ${name}`, () => {
      expect(memoryQuantityValidator(new FormControl(value)) === null).toBe(valid);
    });
  });
});
