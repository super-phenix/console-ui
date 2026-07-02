import { Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { LABEL_MAX_LENGTH } from '@shared/models/consts';
import { take } from 'rxjs';
import { StepLabelDialog } from './step-label-dialog.component';

@Component({
  selector: 'spx-step-label',
  imports: [MatChipsModule, MatIconModule, MatButtonModule],
  templateUrl: './step-label.component.html',
  styleUrl: './step-label.component.scss',
})
export class StepLabelComponent {
  private dialog = inject(MatDialog);

  titleText = input<string>('Labels');
  subtitleText = input<string>('Define label list');

  prefix = input<string>('');
  maxSize = input<number>(0);

  labels = input<string[]>([]);
  labelsChange = output<string[]>();
  labelMaxLength = computed(() => LABEL_MAX_LENGTH - this.prefix().length);

  addLabel() {
    if (this.maxSize() <= 0 || this.maxSize() >= this.labels().length + 1) {
      const ref = this.dialog.open(StepLabelDialog, {
        data: {
          prefix: this.prefix(),
        },
        width: '500px',
        minWidth: '500px',
      });

      ref
        .afterClosed()
        .pipe(take(1))
        .subscribe((res: string) => {
          if (res) {
            this.labels().push(res);
            this.labelsChange.emit(this.labels());
          }
        });
    }
  }

  editLabel(i: number, value: string) {
    if (this.prefix()) {
      value = value.replace(this.prefix(), '');
    }

    const ref = this.dialog.open(StepLabelDialog, {
      data: { prefix: this.prefix(), value: value },
      width: '500px',
      minWidth: '500px',
    });

    ref
      .afterClosed()
      .pipe(take(1))
      .subscribe((res: string) => {
        if (res) {
          this.labels()[i] = res;
          this.labelsChange.emit(this.labels());
        }
      });
  }

  removeLabel(i: number) {
    this.labels().splice(i, 1);
    this.labelsChange.emit(this.labels());
  }
}
