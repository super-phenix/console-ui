import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductSubnet } from '@products/00_shared/models/product.model';

import { NetworkSelectComponent } from './network-select.component';

describe('NetworkSelectComponent', () => {
  let component: NetworkSelectComponent;
  let fixture: ComponentFixture<NetworkSelectComponent>;

  const subnet = (id: string, cidrBlock: string) =>
    ({ id, eid: `${id}-eid`, productName: id, subnet: { spec: { cidrBlock } } }) as ProductSubnet;

  const subnets = [
    subnet('safe', '192.168.0.0/24'),
    subnet('pod', '10.10.0.0/16'),
    subnet('service', '10.96.0.0/24'),
    subnet('dual', '192.168.1.0/24,fd00:100::/120'),
  ];

  const warnings = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.product-create__network-drag') as NodeListOf<HTMLElement>).map(
      row => row.querySelector('.color-warn')?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    );

  const select = async (ids: string[]) => {
    fixture.componentRef.setInput('initList', ids);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetworkSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NetworkSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('az', 'az-1');
    fixture.componentRef.setInput('subnets', subnets);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show a warning for a non-overlapping subnet', async () => {
    await select(['safe']);
    expect(warnings()).toEqual(['']);
  });

  it('should show a warning for an overlapping IPv4 subnet', async () => {
    await select(['pod']);
    const [warning] = warnings();
    expect(warning).toContain('overlaps the default KaaS ranges: pod (10.0.0.0/12).');
    expect(warning).toContain('KaaS nodes using it may encounter connectivity issues.');
    expect(warning).not.toContain('service');
  });

  it('should only list the overlapping entry of a dual-stack cidrBlock', async () => {
    await select(['dual']);
    const [warning] = warnings();
    expect(warning).toContain('pod (fd00:100::/96).');
    expect(warning).not.toContain('10.0.0.0/12');
    expect(warning).not.toContain('10.96.0.0/16');
  });

  it('should show one warning per overlapping selected subnet', async () => {
    await select(['pod', 'safe', 'service']);
    const rows = warnings();
    expect(rows.length).toBe(3);
    expect(rows[0]).toContain('pod (10.0.0.0/12).');
    expect(rows[1]).toBe('');
    expect(rows[2]).toContain('service (10.96.0.0/16).');
    expect(fixture.nativeElement.querySelectorAll('.color-warn').length).toBe(2);
  });

  it('should show a warning for a subnet added from the picker', async () => {
    component.subnetSelected().setValue(subnets[2]);
    component.addItem();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warnings()[0]).toContain('service (10.96.0.0/16).');
  });

  describe('sibling subnets of the same VPC', () => {
    const vpcSubnet = (id: string, cidrBlock: string, vpc?: string) =>
      ({ id, eid: `${id}-eid`, productName: id, subnet: { spec: { cidrBlock, vpc } } }) as ProductSubnet;

    const vpcSubnets = [
      vpcSubnet('a-safe', '192.168.0.0/24', 'vpc-a'),
      vpcSubnet('a-pod', '10.10.0.0/16', 'vpc-a'),
      vpcSubnet('b-service', '10.96.0.0/24', 'vpc-b'),
      vpcSubnet('c-safe', '192.168.3.0/24', 'vpc-c'),
      vpcSubnet('c-dual', '192.168.1.0/24,fd00:100::/120', 'vpc-c'),
      vpcSubnet('d-pod', '10.0.0.0/24', 'vpc-d'),
      vpcSubnet('d-safe', '192.168.4.0/24', 'vpc-d'),
      vpcSubnet('novpc-safe', '192.168.2.0/24'),
      vpcSubnet('novpc-pod', '10.10.1.0/24'),
    ];

    const rowWarnings = (): string[][] =>
      Array.from(
        fixture.nativeElement.querySelectorAll('.product-create__network-drag') as NodeListOf<HTMLElement>
      ).map(row =>
        Array.from(row.querySelectorAll('.color-warn')).map(w => w.textContent?.replace(/\s+/g, ' ').trim() ?? '')
      );

    beforeEach(() => {
      fixture.componentRef.setInput('subnets', vpcSubnets);
    });

    it('should warn about an overlapping sibling of the same VPC', async () => {
      await select(['a-safe']);
      const [row] = rowWarnings();
      expect(row.length).toBe(1);
      expect(row[0]).toContain('other subnets of this VPC overlap the default KaaS ranges: a-pod (10.10.0.0/16).');
      expect(row[0]).toContain('KaaS pods may not be able to reach them.');
    });

    it('should not warn about an overlapping subnet of another VPC', async () => {
      await select(['d-safe']);
      const [row] = rowWarnings();
      expect(row.length).toBe(1);
      expect(row[0]).toContain('d-pod (10.0.0.0/24).');
      expect(row[0]).not.toContain('a-pod');
      expect(row[0]).not.toContain('b-service');
      expect(row[0]).not.toContain('novpc-pod');
    });

    it('should only show the subnet own warning when no sibling overlaps', async () => {
      await select(['d-pod']);
      const [row] = rowWarnings();
      expect(row.length).toBe(1);
      expect(row[0]).toContain('this subnet overlaps the default KaaS ranges: pod (10.0.0.0/12).');
      expect(row[0]).not.toContain('other subnets of this VPC');
    });

    it('should not show a sibling warning for a subnet without VPC', async () => {
      await select(['novpc-safe']);
      expect(rowWarnings()).toEqual([[]]);
    });

    it('should warn about a dual-stack sibling with a single overlapping entry', async () => {
      await select(['c-safe']);
      const [row] = rowWarnings();
      expect(row.length).toBe(1);
      expect(row[0]).toContain('c-dual (192.168.1.0/24,fd00:100::/120).');
    });

    it('should never report the selected subnet as its own sibling', async () => {
      await select(['a-pod', 'a-safe']);
      const [podRow, safeRow] = rowWarnings();
      expect(podRow.length).toBe(1);
      expect(podRow[0]).toContain('this subnet overlaps the default KaaS ranges');
      expect(safeRow.length).toBe(1);
      expect(safeRow[0]).toContain('other subnets of this VPC overlap the default KaaS ranges: a-pod (10.10.0.0/16).');
      expect(component.kaasOverlappingSiblings(vpcSubnets[1])).toEqual([]);
    });
  });
});
