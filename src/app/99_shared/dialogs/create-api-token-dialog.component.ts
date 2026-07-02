import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { noWhitespaceValidator } from '@shared/utils/validators';

@Component({
  selector: 'spx-create-api-token-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  template: `
    <h2 mat-dialog-title>Create an API Token</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field class="w-100">
          <mat-label>Token Name</mat-label>
          <input matInput type="text" autocomplete="off" formControlName="name" [maxlength]="maxLength" />
          <mat-hint align="end"> {{ form.get('name')?.value?.length || 0 }} / {{ maxLength }} </mat-hint>
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
          @if (form.get('name')?.hasError('whitespace')) {
            <mat-error>Name cannot start or end with whitespace</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="w-100 mt-3">
          <mat-label>Expires at (optional)</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="expiresAt" [min]="minDate" />
          <button
            mat-icon-button
            matSuffix
            (click)="resetExpiresAt(); $event.stopPropagation()"
            aria-label="Clear expiration date"
            [style.visibility]="form.get('expiresAt')?.value ? 'visible' : 'hidden'">
            <mat-icon>clear</mat-icon>
          </button>
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          @if (form.get('expiresAt')?.hasError('matDatepickerMin')) {
            <mat-error>Date cannot be prior to today</mat-error>
          }
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button type="button" mat-button mat-dialog-close>Cancel</button>
      <button type="button" matButton="filled" color="primary" [disabled]="!form.valid" (click)="create()">
        Create
      </button>
    </div>
  `,
  styles: `
    .dialog-form {
      padding-block: 0.75rem;
      min-width: 400px;
    }
  `,
})
export class CreateApiTokenDialog {
  readonly dialogRef = inject(MatDialogRef<CreateApiTokenDialog>);
  maxLength = MAX_NAME_LENGTH;
  minDate = new Date();

  constructor() {
    // Create a date
    const today = new Date();
    // Set date to current date plus 1 day
    this.minDate.setDate(today.getDate() + 1);
  }

  form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, noWhitespaceValidator],
    }),
    expiresAt: new FormControl<Date | null>(null),
  });

  resetExpiresAt() {
    this.form.get('expiresAt')?.reset();
  }

  create() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
