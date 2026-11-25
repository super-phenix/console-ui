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
});
