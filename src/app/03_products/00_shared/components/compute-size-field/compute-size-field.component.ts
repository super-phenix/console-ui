import { Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ComputeSize } from '@products/00_shared/models/compute/instance/instance';
import { startWith, switchMap } from 'rxjs';

// Number input suggesting presets while accepting any value within the control's validators.
@Component({
  selector: 'spx-compute-size-field',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule],
  templateUrl: './compute-size-field.component.html',
  styleUrl: './compute-size-field.component.scss',
})
export class ComputeSizeFieldComponent {
  control = input.required<FormControl<number | null>>();
  label = input.required<string>();
  // Presets to suggest; min and max only feed the error text.
  size = input.required<ComputeSize>();
  suffix = input<string>('');

  // Tracks the current control's value, following control swaps.
  private readonly value = toSignal(
    toObservable(this.control).pipe(switchMap(control => control.valueChanges.pipe(startWith(control.value))))
  );

  // All presets when the field is empty or holds a preset; otherwise presets starting with the typed digits.
  filteredPresets = computed(() => {
    const value = this.value();
    const presets = this.size().presets;
    if (value === null || value === undefined || presets.includes(value)) {
      return presets;
    }
    return presets.filter(preset => String(preset).startsWith(String(value)));
  });
}
