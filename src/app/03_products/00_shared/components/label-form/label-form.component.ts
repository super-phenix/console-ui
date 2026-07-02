import { Component, computed, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { LABEL_MAX_LENGTH } from '@shared/models/consts';
import { labelValidator } from '@shared/utils/validators';

@Component({
  selector: 'spx-label-form',
  imports: [ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatIconModule, MatButtonModule],
  templateUrl: './label-form.component.html',
  styleUrl: './label-form.component.scss',
})
export class LabelFormComponent {
  private fb = inject(FormBuilder);

  prefix = input<string>('');
  init = input<string[]>([]);
  maxSize = input<number>(0);

  labels = output<string[]>();
  isValid = output<boolean>();
  labelMaxLength = computed(() => LABEL_MAX_LENGTH - this.prefix().length);

  labelsFormGroup = this.fb.group({
    labels: this.fb.array<FormControl<string>>([]),
  });

  get labelsArray() {
    return this.labelsFormGroup.get('labels') as FormArray<FormControl<string>>;
  }

  constructor() {
    this.labelsArray.valueChanges.pipe(takeUntilDestroyed()).subscribe(values => {
      const labels = values.map(v => this.prefix() + v);
      this.labels.emit(labels);
      this.isValid.emit(this.labelsArray.valid);
    });

    effect(() => {
      this.labelsArray.clear();
      this.init().forEach(v => {
        this.addLabel(v);
      });
    });
  }

  addLabel(value?: string) {
    if (this.maxSize() <= 0 || this.maxSize() >= this.labelsArray.length + 1) {
      this.labelsArray.push(
        this.fb.nonNullable.control(value || '', [Validators.required, labelValidator(this.prefix())])
      );
    }
  }

  removeLabel(i: number) {
    this.labelsArray.removeAt(i);
  }

  lintFix(i: number) {
    const value = this.labelsArray.controls[i].value;
    if (value !== '' && !value.includes(':')) {
      this.labelsArray.controls[i].setValue(value + ':');
    }
  }
}
