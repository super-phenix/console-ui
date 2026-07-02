import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CollapsibleCardComponent } from '@shared/components/collapsible-card/collapsible-card.component';
import {
  AdvancedOptions,
  AdvancedOptionsInput,
} from '@products/00_shared/models/compute/instance/advanced-options.model';
import { InstanceTypeSettingsDialogComponent } from '../dialogs/instance-type-settings-dialog.component';
import { AdvancedBlocksComponent } from './advanced-blocks/advanced-blocks.component';

@Component({
  selector: 'spx-instance-advanced-create',
  imports: [CollapsibleCardComponent, MatButtonModule, MatIconModule, AdvancedBlocksComponent],
  templateUrl: './instance-advanced-create.component.html',
  styleUrl: './instance-advanced-create.component.scss',
})
export class InstanceAdvancedCreateComponent {
  private dialog = inject(MatDialog);

  /** Resolved state used to seed the controls once. */
  initial = input<AdvancedOptions | undefined>(undefined);

  /** Defaults of the selected instance type, feeding the "Auto" hint without
   *  re-seeding the user's choices. */
  inherited = input<AdvancedOptions | undefined>(undefined);

  /** Selected instance type and its AZ, for the "View instance type settings"
   *  button. Null until a type is picked. */
  instanceTypeName = input<string | null | undefined>(undefined);
  az = input<string | null | undefined>(undefined);

  advancedChange = output<AdvancedOptionsInput>();

  /** Open the read-only modal with the selected instance type's full spec. */
  protected openInstanceTypeSettings(): void {
    if (!this.instanceTypeName() || !this.az()) return;
    this.dialog.open(InstanceTypeSettingsDialogComponent, {
      data: { instanceTypeName: this.instanceTypeName(), az: this.az() },
      panelClass: 'dialog--large',
    });
  }
}
