import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'spx-step-datastore',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatIconModule],
  templateUrl: './step-datastore.component.html',
  styleUrl: './step-datastore.component.scss',
})
export class StepDataStoreComponent {
  formGroup = input.required<FormGroup>();
  storageClassList = input<string[]>([]);
  min = input<number>(1);
}
