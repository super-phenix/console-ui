import { Clipboard } from '@angular/cdk/clipboard';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'spx-span-copy',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './span-copy.component.html',
  styleUrl: './span-copy.component.scss',
})
export class SpanCopyComponent {
  protected clipboard = inject(Clipboard);
  private readonly snackbar = inject(MatSnackBar);

  key = input<string>();
  value = input.required<string | undefined>();

  copy() {
    if (this.value()) {
      this.clipboard.copy(this.value()!);
      this.snackbar.open('Copy to clipboard!', undefined, {
        horizontalPosition: 'end',
        duration: 3000,
      });
    }
  }
}
