import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroupDirective,
  NgForm,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { IsIPinRange, IsValidIp, IsValidIPv4 } from '@products/00_shared/utils/ip';
import { LABEL_REGEX } from '@shared/models/consts';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

export function noWhitespaceValidator(control: AbstractControl<string | undefined | null>): ValidationErrors | null {
  if (control.value && (control.value.startsWith(' ') || control.value.endsWith(' '))) {
    return { whitespace: true };
  } else {
    return null;
  }
}

export function exclusiveControlsValidator(...controls: AbstractControl<string | undefined | null>[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const filled = control.value;
    for (const c of controls) {
      if (c.value && filled) {
        return { exclusive: true };
      }
    }
    return null;
  };
}

export function labelValidator(prefix?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value) {
      const text = prefix + control.value;
      if (!LABEL_REGEX.test(text)) {
        return {
          label: true,
        };
      }
    }
    return null;
  };
}

export function ipValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value && !IsValidIp(control.value)) {
      return { ip: true };
    }
    return null;
  };
}

export function ipv4Validator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value && !IsValidIPv4(control.value)) {
      return { ipv4: true };
    }
    return null;
  };
}

// IP must fall within the given CIDR range(s). Use alongside ipValidator().
export function ipInCidrValidator(cidr: string | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || !cidr) {
      return null;
    }
    return IsIPinRange(cidr, control.value) ? null : { ipRange: true };
  };
}

// Value must be a parseable JSON document. Empty values pass (required owns emptiness).
export function jsonValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    try {
      JSON.parse(control.value);
      return null;
    } catch {
      return { json: true };
    }
  };
}

export function uniqueRoutesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const formArray = control as FormArray;
    if (!formArray || !formArray.controls) {
      return null;
    }

    const routes = formArray.controls.map(c => {
      const v = c.getRawValue();
      return `${v.policy}-${v.cidr}-${v.nextHopIP}-${v.routeTable}`;
    });

    // Clear existing unique errors on all controls
    formArray.controls.forEach(c => {
      const errors = c.errors;
      if (errors) {
        delete errors['unique'];
        if (Object.keys(errors).length === 0) {
          c.setErrors(null);
        } else {
          c.setErrors(errors);
        }
      }
    });

    const duplicates: number[] = [];
    routes.forEach((route: string, index: number) => {
      const firstIndex = routes.indexOf(route);
      if (firstIndex !== index) {
        if (!duplicates.includes(firstIndex)) {
          duplicates.push(firstIndex);
        }
        duplicates.push(index);
      }
    });

    if (duplicates.length > 0) {
      duplicates.forEach(index => {
        const ctrl = formArray.at(index);
        ctrl.setErrors({ ...ctrl.errors, unique: true });
      });
      return { uniqueRoutes: true };
    }

    return null;
  };
}
