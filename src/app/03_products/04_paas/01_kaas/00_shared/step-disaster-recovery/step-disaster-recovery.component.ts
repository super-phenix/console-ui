import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'spx-step-disaster-recovery',
  imports: [FormsModule, MatSlideToggleModule, MatIconModule, MatTooltipModule],
  templateUrl: './step-disaster-recovery.component.html',
  styleUrl: './step-disaster-recovery.component.scss',
})
export class StepDisasterRecoveryComponent {
  active = model<boolean>();
  disabled = input<boolean>(false);
  disabledTooltip = input<string>('');
}
