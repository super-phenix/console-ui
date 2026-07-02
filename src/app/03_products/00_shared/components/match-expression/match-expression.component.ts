import { transferArrayItem } from '@angular/cdk/drag-drop';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, inject, input, model, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  EXPRESSION_OPERATORS,
  ExpressionOperators,
  MatchExpression,
  OPERATOR_DOES_NOT_EXIST,
  OPERATOR_EXISTS,
  OPERATOR_IN,
  OPERATOR_NOT_IN,
} from '@products/00_shared/models/common.model';
import {
  LABEL_KEY_MAX_LENGTH,
  LABEL_KEY_PATTERN,
  LABEL_VALUE_MAX_LENGTH,
  LABEL_VALUE_PATTERN,
} from '@shared/models/consts';

function dependanceValidation(depControl: AbstractControl): ValidatorFn {
  return (_: AbstractControl): ValidationErrors | null => {
    return depControl.errors;
  };
}

@Component({
  selector: 'spx-match-expression',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  templateUrl: './match-expression.component.html',
  styleUrl: './match-expression.component.scss',
})
export class MatchExpressionComponent {
  private fb = inject(FormBuilder);

  readonly showTitle = input(true);
  readonly showCheckbox = input(false);
  enabled = model(true);

  readonly addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  readonly values = signal<string[]>([]);
  readonly EXPRESSION_OPERATORS = EXPRESSION_OPERATORS;
  readonly OPERATOR_IN = OPERATOR_IN;
  readonly OPERATOR_NOT_IN = OPERATOR_NOT_IN;

  labelValueMaxLength = LABEL_VALUE_MAX_LENGTH;
  labelValuePattern = LABEL_VALUE_PATTERN;
  labelKeyMaxLength = LABEL_KEY_MAX_LENGTH;
  labelKeyPattern = LABEL_KEY_PATTERN;

  // Inputs / Outputs
  matchExpressions = model<MatchExpression[]>([]);

  // Properties
  errors = signal<string[]>([]);

  newValueControl = new FormControl('');
  matchForm = this.fb.group({
    key: new FormControl<string>('', [Validators.required]),
    operator: new FormControl<ExpressionOperators>(OPERATOR_IN, Validators.required),
    values: new FormControl<string[]>([], {
      validators: [Validators.required, dependanceValidation(this.newValueControl)],
    }),
  });

  constructor() {
    this.matchForm
      .get(['operator'])
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(v => {
        if (v === OPERATOR_IN || v === OPERATOR_NOT_IN) {
          this.matchForm.get(['values'])?.addValidators(Validators.required);
        } else if (v === OPERATOR_EXISTS || v === OPERATOR_DOES_NOT_EXIST) {
          this.matchForm.get(['values'])?.removeValidators(Validators.required);
          this.newValueControl.reset('');
        }

        this.matchForm.get(['values'])?.updateValueAndValidity();
      });
  }

  add(event: MatChipInputEvent): void {
    if (this.newValueControl.valid) {
      const value = (event.value || '').trim();
      if (value) {
        this.values.update(values => [...values, value]);
        // Clear the input value
        event.chipInput!.clear();
        this.newValueControl.reset('');
        this.matchForm.get('values')?.patchValue(this.values());
      }
    }
  }

  remove(index: number): void {
    this.values.update(values => {
      if (index < 0) {
        return values;
      }

      values.splice(index, 1);
      return [...values];
    });
    this.matchForm.get('values')?.patchValue(this.values());
  }

  addSelector() {
    if (this.matchForm.valid) {
      const list = [...this.matchExpressions()];

      const op = this.matchForm.get('operator')!.value!;
      const values = op === OPERATOR_IN || op === OPERATOR_NOT_IN ? this.matchForm.get('values')!.value! : [];

      list.push({
        key: this.matchForm.get('key')!.value!,
        operator: op,
        values: values,
      });

      this.matchExpressions.set(list);
      this.values.set([]);
      this.matchForm.reset({ key: '', operator: OPERATOR_IN, values: [] });
    }
  }

  /**
   * Remove an item by it's index in the list
   */
  removeItemByIndex(index: number, array: MatchExpression[]) {
    transferArrayItem(array, [], index, 0);
    this.matchExpressions.set([...array]);
  }
}
