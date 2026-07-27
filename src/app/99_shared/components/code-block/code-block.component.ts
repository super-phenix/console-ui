import { Clipboard } from '@angular/cdk/clipboard';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'spx-code-block',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './code-block.component.html',
  styleUrl: './code-block.component.scss',
})
export class CodeBlockComponent {
  private readonly clipboard = inject(Clipboard);
  private readonly snackbar = inject(MatSnackBar);

  code = input.required<string>();
  label = input<string>();

  copy() {
    if (this.code()) {
      this.clipboard.copy(this.code());
      this.snackbar.open('Copy to clipboard!', undefined, {
        horizontalPosition: 'end',
        duration: 3000,
      });
    }
  }
}
