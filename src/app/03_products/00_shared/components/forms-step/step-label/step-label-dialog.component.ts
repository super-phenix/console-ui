import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LABEL_MAX_LENGTH, MAX_NAME_LENGTH } from '@shared/models/consts';
import { labelValidator } from '@shared/utils/validators';

export interface StepLabelDialogData {
  prefix?: string;
  value?: string;
}

@Component({
  selector: 'spx-step-label-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    CdkTextareaAutosize,
  ],
  template: `
    <h2 mat-dialog-title>Label Edition</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <form class="dialog-form">
        <mat-form-field
          class="flex-grow mat-mdc-form-field--large-prefix"
          floatLabel="always"
          subscriptSizing="dynamic">
          <textarea
            matInput
            cdkTextareaAutosize
            type="text"
            autocomplete="off"
            [maxlength]="labelMaxLength"
            [formControl]="control"
            (blur)="lintFix()"></textarea>
          @if (prefix) {
            <div matTextPrefix class="dialog-form__prefix">
              <span>{{ prefix }}</span>
            </div>
          }
          <mat-hint align="end">{{ prefix.length + control.value.length }}/{{ labelMaxLength }}</mat-hint>
          @if (control.getError('label')) {
            <mat-error>The label syntax is invalid</mat-error>
          }
          @if (control.getError('required')) {
            <mat-error>This field is required</mat-error>
          }
        </mat-form-field>
      </form>

      <div class="d-flex flex-column">
        <h3>Naming convention</h3>
        <span>Labels are composed of a key and a value. Both parts are separated by a <code>:</code></span>
        <br />
        <span>
          A valid key is composed of 2 segments, an optional prefix and a name separated by a <code>/</code>.
        </span>
        <br />
        <span>
          The name segment is required, must be 63 characters or less, start and end with an alphanumeric character and
          may contain <code>-</code>, <code>_</code>, <code>.</code> and alphanumeric characters.
        </span>
        <br />
        <span> If the prefix is specified, it must be a DNS subdomain. </span>

        <br />
        <br />

        <span>The value must meet the following criteria:</span>
        <ul>
          <li>Must be 63 characters or less. Can be empty.</li>
          <li>If present, must start and end with an alphanumeric character.</li>
          <li>
            May contain the following characters in the middle: <code>-</code>, <code>_</code>, <code>.</code> and
            alphanumeric characters
          </li>
        </ul>

        <span>
          <i>The <code>:</code> separator must be present even if the value is empty.</i>
        </span>
      </div>
    </div>
    <div mat-dialog-actions>
      <button matButton="outlined" mat-dialog-close>Cancel</button>
      <button matButton="filled" color="primary" [disabled]="!control.valid" (click)="create()">
        {{ data?.value ? 'Edit' : 'Add' }}
      </button>
    </div>
  `,
  styles: `
    @use '@angular/material' as mat;

    .dialog-form {
      width: 100%;
      display: flex;
      flex-direction: column;

      @include mat.form-field-overrides(
        (
          filled-container-color: var(--mat-sys-background),
        )
      );

      &__prefix {
      }

      .mat-mdc-form-field-flex {
        align-items: start !important;

        .mat-mdc-form-field-text-prefix {
          padding-top: 16px !important;
        }
      }
    }

    code {
      background-color: var(--background);
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      padding: 0 3px;
    }
  `,
})
export class StepLabelDialog {
  readonly dialogRef = inject(MatDialogRef<StepLabelDialog>);
  readonly fb = inject(FormBuilder);
  data: StepLabelDialogData | undefined = inject(MAT_DIALOG_DATA);
  maxLength = MAX_NAME_LENGTH;

  prefix = this.data?.prefix || '';
  initValue = this.data?.value || '';
  labelMaxLength = LABEL_MAX_LENGTH - this.prefix.length;

  control = this.fb.nonNullable.control(this.initValue, [Validators.required, labelValidator(this.prefix)]);

  lintFix() {
    const value = this.control.value;
    if (value !== '' && !value.includes(':')) {
      this.control.setValue(value + ':');
    }
  }

  create() {
    if (this.control.valid) {
      this.dialogRef.close(this.prefix + this.control.value);
    }
  }
}
