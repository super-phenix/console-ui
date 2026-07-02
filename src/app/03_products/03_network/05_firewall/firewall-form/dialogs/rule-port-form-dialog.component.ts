import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { RulePortFormComponent } from '../rule-port-form/rule-port-form.component';
import { FwRulePort } from '@products/00_shared/models/network/firewall/firewall.model';

export interface RulePortFormDataDialog {
  rules: FwRulePort[];
}

@Component({
  selector: 'spx-rule-port-form-dialog',
  imports: [MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, RulePortFormComponent],
  template: `
    <h2 mat-dialog-title>Ports</h2>
    <div mat-dialog-content>
      <div class=" py-2">
        <spx-rule-port-form [(rulePorts)]="rulePorts"></spx-rule-port-form>
      </div>
    </div>
    <div mat-dialog-actions>
      <button type="button" mat-stroked-button mat-dialog-close>Cancel</button>
      <button type="button" matButton="filled" color="primary" (click)="sendForm()">Confirm</button>
    </div>
  `,
})
export class RulePortFormDialog {
  readonly dialogRef = inject(MatDialogRef<RulePortFormDialog>);

  readonly data: RulePortFormDataDialog = inject(MAT_DIALOG_DATA);

  rulePorts = signal<FwRulePort[]>([...this.data.rules]);

  sendForm() {
    if (this.rulePorts()) {
      const res = this.rulePorts();
      this.dialogRef.close(res);
    }
  }
}
