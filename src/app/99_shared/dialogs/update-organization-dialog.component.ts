import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MAX_CONTACT_LENGTH, MAX_NAME_LENGTH } from '@shared/models/consts';
import { noWhitespaceValidator } from '@shared/utils/validators';

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  template: `
    <h2 mat-dialog-title>Edit an organization</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <form class="dialog-form" [formGroup]="formGroup">
        <h2>Organization name</h2>
        <mat-form-field class="w-100">
          <mat-label>Organization name</mat-label>
          <input matInput type="text" autocomplete="off" [maxlength]="maxLength" formControlName="name" />
          <mat-hint align="end"> {{ formGroup.get('name')?.getRawValue()?.length }} / {{ maxLength }} </mat-hint>
          @if (formGroup.get('name')?.hasError('required')) {
            <mat-error>This field is required</mat-error>
          }
          @if (formGroup.get('name')?.hasError('whitespace')) {
            <mat-error>The field cannot start or end with a space</mat-error>
          }
        </mat-form-field>

        <h2>Contacts</h2>
        <mat-form-field class="w-100">
          <mat-label>Administrative Contact</mat-label>
          <input
            matInput
            type="text"
            autocomplete="off"
            [maxlength]="maxContactLength"
            formControlName="administrativeContact" />
          <mat-hint align="end">
            {{ formGroup.get('administrativeContact')?.getRawValue()?.length }} / {{ maxContactLength }}
          </mat-hint>
        </mat-form-field>
        <mat-form-field class="w-100 my-2">
          <mat-label>Billing Contact</mat-label>
          <input
            matInput
            type="text"
            autocomplete="off"
            [maxlength]="maxContactLength"
            formControlName="billingContact" />
          <mat-hint align="end">
            {{ formGroup.get('billingContact')?.getRawValue()?.length }} / {{ maxContactLength }}
          </mat-hint>
        </mat-form-field>
        <mat-form-field class="w-100">
          <mat-label>Technical Contact</mat-label>
          <input
            matInput
            type="text"
            autocomplete="off"
            [maxlength]="maxContactLength"
            formControlName="technicalContact" />
          <mat-hint align="end">
            {{ formGroup.get('technicalContact')?.getRawValue()?.length }} / {{ maxContactLength }}
          </mat-hint>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions>
      <button type="button" mat-stroked-button mat-dialog-close>Cancel</button>
      <button type="button" matButton="filled" color="primary" [disabled]="!formGroup.valid" (click)="update()">
        Update
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
export class UpdateOrganizationDialog {
  readonly dialogRef = inject(MatDialogRef<UpdateOrganizationDialog>);
  data: { name: string; administrativeContact: string; billingContact: string; technicalContact: string } =
    inject(MAT_DIALOG_DATA);
  maxLength = MAX_NAME_LENGTH;
  maxContactLength = MAX_CONTACT_LENGTH;

  formGroup = new FormGroup({
    name: new FormControl<string | undefined>(this.data.name, [Validators.required, noWhitespaceValidator]),
    administrativeContact: new FormControl<string | undefined>(this.data.administrativeContact),
    billingContact: new FormControl<string | undefined>(this.data.billingContact),
    technicalContact: new FormControl<string | undefined>(this.data.technicalContact),
  });

  update() {
    if (this.formGroup.valid) {
      const res = this.formGroup.value;
      this.dialogRef.close(res);
    }
  }
}
