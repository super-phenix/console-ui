import { transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, inject, input, model } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatchLabel } from '@products/00_shared/models/common.model';
import {
  LABEL_KEY_MAX_LENGTH,
  LABEL_KEY_PATTERN,
  LABEL_VALUE_MAX_LENGTH,
  LABEL_VALUE_PATTERN,
} from '@shared/models/consts';

@Component({
  selector: 'spx-match-label',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCheckboxModule],
  templateUrl: './match-label.component.html',
  styleUrl: './match-label.component.scss',
})
export class MatchLabelComponent {
  private fb = inject(FormBuilder);

  readonly showTitle = input(true);
  readonly showCheckbox = input(false);
  enabled = model(true);

  labelValueMaxLength = LABEL_VALUE_MAX_LENGTH;
  labelValuePattern = LABEL_VALUE_PATTERN;
  labelKeyMaxLength = LABEL_KEY_MAX_LENGTH;
  labelKeyPattern = LABEL_KEY_PATTERN;

  matchLabels = model<MatchLabel[]>([]);
  matchForm = this.fb.group({
    key: new FormControl<string>('', [Validators.required]),
    value: new FormControl<string>(''),
  });

  addSelector() {
    if (this.matchForm.valid) {
      const list = [...this.matchLabels()];
      list.push({
        key: this.matchForm.get('key')!.value!,
        value: this.matchForm.get('value')!.value!,
      });

      list.sort((a, b) => a.key.localeCompare(b.key));

      this.matchLabels.set(list);
      this.matchForm.reset({ key: '', value: '' });
    }
  }

  /**
   * Remove an item by it's index in the list
   */
  removeItemByIndex(index: number, array: MatchLabel[]) {
    transferArrayItem(array, [], index, 0);
    this.matchLabels.set([...array]);
  }
}
