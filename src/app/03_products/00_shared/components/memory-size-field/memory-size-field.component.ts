import { Component, computed, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  MEMORY_MAX,
  MEMORY_MIN,
  MEMORY_PRESET_LIST,
  MEMORY_UNITS,
  MemoryValue,
} from '@products/00_shared/models/compute/instance/instance';
import {
  BinaryUnit,
  BYTES_PER_MIB,
  bytesPerUnit,
  parseQuantityToBytes,
  splitQuantity,
} from '@products/00_shared/utils/quantity';
import { startWith, switchMap } from 'rxjs';

// Amount and unit inputs editing one memory quantity control ("4Gi", "1536Mi").
@Component({
  selector: 'spx-memory-size-field',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatAutocompleteModule],
  templateUrl: './memory-size-field.component.html',
  styleUrl: './memory-size-field.component.scss',
})
export class MemorySizeFieldComponent {
  control = input.required<FormControl<MemoryValue | null>>();
  label = input<string>('RAM');

  readonly units = MEMORY_UNITS;
  readonly min = MEMORY_MIN;
  readonly max = MEMORY_MAX;

  readonly amount = new FormControl<number | null>(null);
  readonly unit = new FormControl<BinaryUnit>('Gi', { nonNullable: true });

  // Shows the quantity control's errors on the amount input.
  readonly errorMatcher: ErrorStateMatcher = {
    isErrorState: () => this.control().invalid && (this.control().touched || this.amount.touched),
  };

  private readonly amountValue = toSignal(this.amount.valueChanges.pipe(startWith(this.amount.value)));

  // Presets in GiB: all of them when the field is empty or holds a preset, otherwise those starting with the typed digits.
  filteredPresets = computed(() => {
    const amount = this.amountValue();
    if (amount === null || amount === undefined || MEMORY_PRESET_LIST.includes(amount)) {
      return MEMORY_PRESET_LIST;
    }
    return MEMORY_PRESET_LIST.filter(preset => String(preset).startsWith(String(amount)));
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    toObservable(this.control)
      .pipe(
        switchMap(control => control.valueChanges.pipe(startWith(control.value))),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe(value => this.showQuantity(value));

    this.amount.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => this.syncControl());

    // Converts the amount to the new unit, the control still holding the previous quantity.
    this.unit.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(unit => {
      const bytes = parseQuantityToBytes(this.control().value ?? '');
      if (bytes !== null) {
        this.amount.setValue(bytes / bytesPerUnit(unit), { emitEvent: false });
      }
      this.syncControl();
    });
  }

  // Presets are in GiB, so the amount is kept as is.
  selectPreset(): void {
    this.unit.setValue('Gi', { emitEvent: false });
    this.syncControl();
  }

  markTouched(): void {
    this.control().markAsTouched();
  }

  private syncControl(): void {
    const amount = this.amount.value;
    const quantity = amount === null || amount === undefined ? null : `${amount}${this.unit.value}`;
    if (quantity !== this.control().value) {
      this.control().setValue(quantity, { emitEvent: false });
      this.control().markAsDirty();
    }
  }

  // Splits the quantity into the amount and unit inputs without echoing back into the control.
  private showQuantity(value: MemoryValue | null): void {
    if (!value) {
      this.amount.setValue(null, { emitEvent: false });
      return;
    }
    const split = splitQuantity(value);
    if (split && this.units.includes(split.unit)) {
      this.amount.setValue(split.value, { emitEvent: false });
      this.unit.setValue(split.unit, { emitEvent: false });
      return;
    }
    const bytes = parseQuantityToBytes(value);
    this.amount.setValue(bytes === null ? null : bytes / BYTES_PER_MIB, { emitEvent: false });
    this.unit.setValue('Mi', { emitEvent: false });
  }
}
