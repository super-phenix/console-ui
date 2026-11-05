import { AbstractControl, ValidationErrors } from '@angular/forms';

export const NODE_ROLE_MAX_LENGTH = 63;
export const NODE_ROLE_LABEL_PREFIX = 'node-role.kubernetes.io/';

const NODE_ROLE_REGEX = /^[A-Za-z0-9]([-A-Za-z0-9_.]*[A-Za-z0-9])?$/;

/** Validates a node role usable as a Kubernetes label name and value. Empty is valid. */
export function nodeRoleValidator(control: AbstractControl<string | undefined | null>): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }
  if (value.length > NODE_ROLE_MAX_LENGTH || !NODE_ROLE_REGEX.test(value)) {
    return { nodeRolePattern: true };
  }
  return null;
}
