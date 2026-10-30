import { Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DATASTORE_STORAGE_MAX } from '@products/00_shared/models/paas/kaas/kaas';
import { AutoSelectDirective } from '@shared/directives/auto-select.directive';

@Component({
  selector: 'spx-step-datastore',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    AutoSelectDirective,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './step-datastore.component.html',
  styleUrl: './step-datastore.component.scss',
})
export class StepDataStoreComponent {
  formGroup = input.required<FormGroup>();
  storageClassList = input<string[]>([]);
  // Size of the existing dedicated datastore, which cannot be shrunk; null when there is none.
  currentStorage = input<number | null>(null);
  min = computed(() => this.currentStorage() ?? 1);
  max = DATASTORE_STORAGE_MAX;
}
