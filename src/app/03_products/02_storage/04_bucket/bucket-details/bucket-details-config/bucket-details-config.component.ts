import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TextEditorDialog } from '@products/00_shared/dialogs/text-editor-dialog.component';
import { ProductBucket } from '@products/00_shared/models/product.model';
import { GridDirective } from '@shared/directives/grid.directive';

@Component({
  selector: 'spx-bucket-details-config',
  imports: [MatButtonModule, MatIconModule, GridDirective],
  templateUrl: './bucket-details-config.component.html',
})
export class BucketDetailsConfigComponent {
  private readonly dialog = inject(MatDialog);

  bucket = input.required<ProductBucket>();

  viewJson(title: string, value?: string) {
    if (!value) {
      return;
    }
    let text = value;
    try {
      text = JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      // keep the raw value
    }
    this.dialog.open(TextEditorDialog, {
      data: { title, text, readonly: true },
      panelClass: 'dialog--large',
    });
  }
}
