import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

@Component({
  selector: 'spx-label-selector-syntax-helper-dialog',
  imports: [MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  template: `
    <h2 mat-dialog-title>Naming convention for selectors</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <span>Labels are composed of a Key and a Value. Both parts are separated by a <code>:</code></span>
      <br />
      <span> A valid key is composed of 2 segments, an optional prefix and a name separated by a <code>/</code>. </span>
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
        For an expression with operator <strong>In</strong> or <strong>NotIn</strong>, you can set a list of values
        (each value must match with the above criteria)
      </span>
    </div>
    <div mat-dialog-actions>
      <button type="button" matButton="filled" mat-dialog-close>Ok</button>
    </div>
  `,
  styles: `
    code {
      background-color: var(--background);
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      padding: 0 3px;
    }
  `,
})
export class LabelSelectorSyntaxHelperDialog {
  readonly dialogRef = inject(MatDialogRef<LabelSelectorSyntaxHelperDialog>);
}
