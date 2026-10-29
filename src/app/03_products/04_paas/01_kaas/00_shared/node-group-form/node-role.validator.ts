import { AbstractControl, ValidationErrors } from '@angular/forms';

export const NODE_ROLE_MAX_LENGTH = 63;
export const NODE_ROLE_LABEL_PREFIX = 'node-role.kubernetes.io/';

const NODE_ROLE_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
const RESERVED_NODE_ROLES = ['control-plane', 'master'];

/** Validates a DNS-1123 label that is not a reserved node role. Empty is valid. */
export function nodeRoleValidator(control: AbstractControl<string | undefined | null>): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }
  if (!NODE_ROLE_REGEX.test(value)) {
    return { nodeRolePattern: true };
  }
  if (RESERVED_NODE_ROLES.includes(value)) {
    return { nodeRoleReserved: true };
  }
  return null;
}
