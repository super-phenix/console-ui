import { AbstractControl, FormArray, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export const NODE_GROUP_NAME_MAX_LENGTH = 14;

const NODE_GROUP_NAME_REGEX = /^[A-Za-z0-9]([-A-Za-z0-9]*[A-Za-z0-9])?$/;

/** Validators of a node group name, also used as the pool name and the default node role. */
export const NODE_GROUP_NAME_VALIDATORS: ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(NODE_GROUP_NAME_MAX_LENGTH),
  Validators.pattern(NODE_GROUP_NAME_REGEX),
];

/** Flags the name control of node groups sharing a name with `unique`. */
export function uniqueNodeGroupNamesValidator(control: AbstractControl): ValidationErrors | null {
  const groups = control as FormArray;
  const names = groups.controls.map(g => g.get('name'));

  names.forEach(c => {
    if (c?.errors?.['unique']) {
      const errors = { ...c.errors };
      delete errors['unique'];
      c.setErrors(Object.keys(errors).length ? errors : null);
    }
  });

  const values = names.map(c => c?.getRawValue());
  let duplicate = false;
  names.forEach((c, i) => {
    if (c && values[i] && values.indexOf(values[i]) !== values.lastIndexOf(values[i])) {
      c.setErrors({ ...c.errors, unique: true });
      duplicate = true;
    }
  });

  return duplicate ? { uniqueNodeGroupNames: true } : null;
}
