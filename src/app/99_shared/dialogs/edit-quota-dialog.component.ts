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
import { MatSelectModule } from '@angular/material/select';
import { QUOTA_RESOURCES, QuotaResourceEnum, QuotaResources } from '@shared/models/data/quota';
import {
  formatQuotaQuantity,
  QUOTA_BYTE_UNITS,
  QUOTA_PARENT_LABELS,
  QUOTA_RESOURCE_LABELS,
  QuotaByteUnit,
  QuotaParentType,
  quotaValue,
  toQuotaFormValue,
  toQuotaQuantity,
} from '@shared/utils/quota';

export interface EditQuotaDialogData {
  title: string;
  description?: string;
  /** Current quota */
  resources: QuotaResources;
  /** Who holds the quota the edited one is taken from, to name it in the hints */
  parentType: QuotaParentType;
  /** What can be allocated at most per resource (null when the parent does not limit it) */
  available?: Partial<Record<QuotaResourceEnum, number | null>>;
  /** Meaning of an empty field */
  emptyHint?: string;
}

type ResourceForm = FormGroup<{
  value: FormControl<number | null>;
  unit: FormControl<QuotaByteUnit>;
}>;

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content class="d-flex flex-column">
      @if (data.description) {
        <span>{{ data.description }}</span>
      }
      <form class="dialog-form" [formGroup]="form">
        @for (resource of resources; track resource) {
          <div class="dialog-form__row" [formGroupName]="resource">
            <mat-form-field class="dialog-form__value">
              <mat-label>{{ labels[resource] }}{{ resource === cpu ? ' (vCPU)' : '' }}</mat-label>
              <input
                matInput
                type="number"
                min="0"
                [step]="resource === cpu ? 0.5 : 1"
                autocomplete="off"
                formControlName="value"
                [attr.data-testid]="'quota-' + resource" />
              @if (hint(resource); as hint) {
                <mat-hint>{{ hint }}</mat-hint>
              }
              @if (form.controls[resource].controls.value.hasError('min')) {
                <mat-error>The value cannot be negative</mat-error>
              }
            </mat-form-field>
            @if (resource !== cpu) {
              <mat-form-field class="dialog-form__unit">
                <mat-label>Unit</mat-label>
                <mat-select formControlName="unit">
                  @for (unit of units; track unit) {
                    <mat-option [value]="unit">{{ unit }}B</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
          </div>
        }
      </form>
      @if (data.emptyHint) {
        <span class="dialog-form__empty-hint"
          ><i>{{ data.emptyHint }}</i></span
        >
      }
    </div>
    <div mat-dialog-actions>
      <button matButton="outlined" mat-dialog-close>Cancel</button>
      <button matButton="filled" color="primary" [disabled]="!form.valid" (click)="save()">Save</button>
    </div>
  `,
  styles: `
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-block: 0.75rem;
      min-width: 400px;

      &__row {
        display: flex;
        gap: 0.75rem;
      }

      &__value {
        flex: 1 1 auto;
      }

      &__unit {
        width: 110px;
      }

      &__empty-hint {
        font: var(--mat-sys-body-small);
      }
    }
  `,
})
export class EditQuotaDialog {
  readonly dialogRef = inject(MatDialogRef<EditQuotaDialog>);
  data: EditQuotaDialogData = inject(MAT_DIALOG_DATA);

  readonly resources = QUOTA_RESOURCES;
  readonly labels = QUOTA_RESOURCE_LABELS;
  readonly units = QUOTA_BYTE_UNITS;
  readonly cpu = QuotaResourceEnum.CPU;

  form = new FormGroup(
    Object.fromEntries(this.resources.map(r => [r, this.buildResourceForm(r)])) as Record<
      QuotaResourceEnum,
      ResourceForm
    >
  );

  hint(resource: QuotaResourceEnum): string | null {
    const available = this.data.available?.[resource];
    if (available === undefined) {
      return null;
    }
    return available === null
      ? `No limit from the parent ${QUOTA_PARENT_LABELS[this.data.parentType]}`
      : `Up to ${formatQuotaQuantity(resource, available)}`;
  }

  save() {
    if (!this.form.valid) {
      return;
    }
    const res: QuotaResources = {};
    for (const resource of this.resources) {
      const { value, unit } = this.form.controls[resource].getRawValue();
      if (value !== null && value !== undefined && `${value}` !== '') {
        res[resource] = toQuotaQuantity(resource, Number(value), unit);
      }
    }
    this.dialogRef.close(res);
  }

  private buildResourceForm(resource: QuotaResourceEnum): ResourceForm {
    const current = quotaValue(this.data.resources, resource);
    const formValue = current === null ? null : toQuotaFormValue(resource, current);
    return new FormGroup({
      value: new FormControl<number | null>(formValue?.value ?? null, [Validators.min(0)]),
      unit: new FormControl<QuotaByteUnit>(formValue?.unit ?? 'Gi', { nonNullable: true }),
    });
  }
}
