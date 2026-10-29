import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { IsIPinRange, IsValidIPv4 } from '@products/00_shared/utils/ip';
import { VIRTUAL_IP_RANGE } from '@shared/models/consts';

// The database load balancer VIP must be an IPv4 address in the virtual IP range (SPX RFC008).
export function virtualIpValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const ip = control.value;
    if (!ip) {
      return null;
    }
    if (!IsValidIPv4(ip)) {
      return { ip: true };
    }
    return IsIPinRange(VIRTUAL_IP_RANGE, ip) ? null : { ipRange: true };
  };
}
