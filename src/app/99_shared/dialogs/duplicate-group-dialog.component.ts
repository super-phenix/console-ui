import { Component, inject } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { noWhitespaceValidator } from '@shared/utils/validators';

export interface DuplicateGroupData {
  sourceName: string;
  /** Names already taken in the organization, refused before hitting the API. */
  existingNames: string[];
}

@Component({
  selector: 'spx-duplicate-group-dialog',
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
    <h2 mat-dialog-title>Duplicate a group</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <span> Create an editable copy of '{{ data.sourceName }}': </span>
      <div class="dialog-form">
        <mat-form-field class="w-100">
          <mat-label>Group name</mat-label>
          <input matInput type="text" autocomplete="off" [formControl]="control" [maxlength]="maxLength" />
          <mat-hint align="end"> {{ control.getRawValue()?.length }} / {{ maxLength }} </mat-hint>
          @if (control.hasError('required')) {
            <mat-error>This field is required</mat-error>
          }
          @if (control.hasError('whitespace')) {
            <mat-error>The field cannot start or end with a space</mat-error>
          }
          @if (control.hasError('taken')) {
            <mat-error>A group with this name already exists</mat-error>
          }
        </mat-form-field>
      </div>
    </div>
    <div mat-dialog-actions>
      <button matButton="outlined" mat-dialog-close>Cancel</button>
      <button matButton="filled" color="primary" [disabled]="!control.valid" (click)="duplicate()">Duplicate</button>
    </div>
  `,
  styles: `
    .dialog-form {
      padding-block: 0.75rem;
      min-width: 400px;
    }
  `,
})
export class DuplicateGroupDialog {
  readonly dialogRef = inject(MatDialogRef<DuplicateGroupDialog>);
  readonly data = inject<DuplicateGroupData>(MAT_DIALOG_DATA);

  maxLength = MAX_NAME_LENGTH;
  control = new FormControl<string | undefined>(this.defaultName(), [
    Validators.required,
    noWhitespaceValidator,
    control => this.nameTakenValidator(control),
  ]);

  duplicate() {
    if (this.control.valid) {
      this.dialogRef.close(this.control.value);
    }
  }

  /** `<source> copy`, truncated so it always fits the name limit. */
  private defaultName(): string {
    return `${this.data.sourceName} copy`.slice(0, MAX_NAME_LENGTH);
  }

  private nameTakenValidator(control: AbstractControl<string | undefined | null>): ValidationErrors | null {
    if (control.value && this.data.existingNames.includes(control.value)) {
      return { taken: true };
    }
    return null;
  }
}
