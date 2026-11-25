import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProtocolEnum } from '@products/00_shared/models/network/subnet/protocol.enum';

import { SubnetCreateComponent } from './subnet-create.component';

describe('SubnetCreateComponent', () => {
  let component: SubnetCreateComponent;
  let fixture: ComponentFixture<SubnetCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubnetCreateComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SubnetCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('KaaS range overlap warning', () => {
    const overlaps = (ipv4: string, ipv6 = '', protocol = ProtocolEnum.IPv4) => {
      component.secondFormGroup.patchValue({ protocol, ipv4, ipv6 });
      return component.kaasOverlaps().map(r => r.cidr);
    };

    it('should not warn by default', () => {
      expect(component.kaasOverlaps()).toEqual([]);
    });

    it('should warn when IPv4 overlaps the pod range', () => {
      expect(overlaps('10.10.0.0/16')).toEqual(['10.0.0.0/12']);
    });

    it('should warn when IPv4 overlaps the service range', () => {
      expect(overlaps('10.96.4.0/24')).toEqual(['10.96.0.0/16']);
    });

    it('should not warn for the default non-overlapping range', () => {
      expect(overlaps('10.32.0.0/16')).toEqual([]);
    });

    it('should not warn while the prefix is incomplete', () => {
      expect(overlaps('10.10.0.0/')).toEqual([]);
    });

    it('should warn when IPv6 overlaps the pod range in IPv6 mode', () => {
      expect(overlaps('', 'fd00:100::/64', ProtocolEnum.IPv6)).toEqual(['fd00:100::/96']);
    });

    it('should ignore a leftover IPv4 value when the protocol is IPv6', () => {
      expect(overlaps('10.10.0.0/16', 'fd00:10:32::/64', ProtocolEnum.IPv6)).toEqual([]);
    });

    it('should warn on the IPv6 service range', () => {
      expect(overlaps('', 'fd00:100:ffff::/64', ProtocolEnum.IPv6)).toEqual(['fd00:100:ffff::/112']);
    });

    it('should update when the protocol changes after the values were entered', () => {
      expect(overlaps('10.10.0.0/16', 'fd00:10:32::/64', ProtocolEnum.IPv4)).toEqual(['10.0.0.0/12']);
      component.secondFormGroup.patchValue({ protocol: ProtocolEnum.IPv6 });
      expect(component.kaasOverlaps()).toEqual([]);
    });

    it('should render and remove the warning in the DOM', () => {
      const el = fixture.nativeElement as HTMLElement;
      component.firstFormGroup.patchValue({ productName: 'subnet', az: 'az1' });
      fixture.detectChanges();
      (el.querySelector('button[matStepperNext]') as HTMLButtonElement).click();
      fixture.detectChanges();
      component.secondFormGroup.patchValue({ ipv4: '10.10.0.0/16' });
      fixture.detectChanges();
      expect(el.textContent).toContain('overlaps the default KaaS');
      component.secondFormGroup.patchValue({ ipv4: '10.32.0.0/16' });
      fixture.detectChanges();
      expect(el.textContent).not.toContain('overlaps the default KaaS');
    });

    it('should warn on the IPv4 side of a dual-stack subnet', () => {
      expect(overlaps('10.10.0.0/16', 'fd00:10:32::/64', ProtocolEnum.Dual)).toEqual(['10.0.0.0/12']);
    });
  });
});
