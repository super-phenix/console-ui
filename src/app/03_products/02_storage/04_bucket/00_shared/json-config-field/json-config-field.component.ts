import { LowerCasePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { TextEditorDialog, TextEditorData } from '@products/00_shared/dialogs/text-editor-dialog.component';
import { firstValueFrom, startWith, switchMap } from 'rxjs';

/**
 * Self-contained row for an optional JSON config field (bucket policy,
 * lifecycle): shows the set/unset state with labeled Add/Edit/Remove actions,
 * opens the text editor dialog and renders the control's validation errors
 * underneath. The parent only owns the control and its validators.
 */
@Component({
  selector: 'spx-json-config-field',
  imports: [LowerCasePipe, MatButtonModule, MatChipsModule, MatFormFieldModule, MatIconModule],
  templateUrl: './json-config-field.component.html',
  styleUrl: './json-config-field.component.scss',
})
export class JsonConfigFieldComponent {
  private dialog = inject(MatDialog);

  label = input.required<string>();
  control = input.required<FormControl<string>>();

  // FormControl.value is not reactive, mirror it into a signal for zoneless CD
  protected value = toSignal(
    toObservable(this.control).pipe(switchMap(ctrl => ctrl.valueChanges.pipe(startWith(ctrl.value))))
  );

  async openEditor() {
    const data: TextEditorData = {
      title: this.label(),
      subtitle: `S3 ${this.label().toLowerCase()} configuration in JSON.`,
      text: this.control().value || '',
      json: true,
    };
    const editorRef = this.dialog.open(TextEditorDialog, { data, panelClass: 'dialog--large' });
    const res = await firstValueFrom<string | undefined>(editorRef.afterClosed());
    if (res === undefined) {
      return;
    }
    this.control().setValue(res);
    this.control().markAsDirty();
  }

  clear() {
    this.control().setValue('');
    this.control().markAsDirty();
  }
}
