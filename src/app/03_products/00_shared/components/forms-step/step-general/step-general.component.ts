import { Component, computed, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AutoSelectDirective } from '@shared/directives/auto-select.directive';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { StateService } from '@shared/services/state.service';

@Component({
  selector: 'spx-step-general',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    AutoSelectDirective,
  ],
  templateUrl: './step-general.component.html',
  styleUrl: './step-general.component.scss',
})
export class StepGeneralComponent {
  protected stateSvc = inject(StateService);
  maxLength = MAX_NAME_LENGTH;

  formGroup = input.required<FormGroup>();
  showAz = input<boolean>(true);
  azChange = output<string>();

  productNameInput = computed(() => {
    const input = this.formGroup().get('productName');
    if (input) {
      return input as FormControl<string>;
    }
    console.error('Failed to find productName formControl');
    return null;
  });

  azInput = computed(() => {
    if (!this.showAz()) {
      return null;
    }
    const input = this.formGroup().get('az');
    if (input) {
      return input as FormControl<string>;
    }
    console.error('Failed to find az formControl');
    return null;
  });
}
