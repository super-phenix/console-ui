import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { RunStrategy } from '@products/00_shared/models/compute/instance/enums/run-strategy.enum';

interface Strategy {
  name: string;
  description: string;
}

@Component({
  selector: 'spx-instance-create-run-strategy-helper-dialog',
  imports: [MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  template: `
    <h2 mat-dialog-title>Run Strategy Information</h2>
    <div mat-dialog-content class="d-flex flex-column">
      @for (s of strategies; track $index) {
        <div>
          <h2>{{ s.name }}</h2>
          <span>{{ s.description }}</span>
        </div>
      }
    </div>
    <div mat-dialog-actions>
      <button type="button" matButton="filled" mat-dialog-close>Ok</button>
    </div>
  `,
})
export class InstanceCreateRunStrategyHelperDialog {
  readonly dialogRef = inject(MatDialogRef<InstanceCreateRunStrategyHelperDialog>);

  strategies: Strategy[] = [
    {
      name: RunStrategy.Always,
      description:
        'The system will try to keep the instance always running. Even when shutdown is requested by the user.',
    },
    {
      name: RunStrategy.RerunOnFailure,
      description: "Similar to 'Always' except the instance is restarted only if it stops unexpectedly (e.g., crash).",
    },
    {
      name: RunStrategy.Once,
      description: 'The system starts the instance only once and will never restart it.',
    },
    {
      name: RunStrategy.Manual,
      description: 'The system does not automatically start or stop an instance. The user controls its status.',
    },
    {
      name: RunStrategy.Halted,
      description: 'The system ensures that the instance is never started.',
    },
  ];
}
