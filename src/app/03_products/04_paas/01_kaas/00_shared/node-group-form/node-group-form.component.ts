import { TitleCasePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { AbstractControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AutoSelectDirective } from '@shared/directives/auto-select.directive';
import { CPU_VALUE_LIST, MEMORY_VALUE_LIST } from '@products/00_shared/models/compute/instance/instance';
import { MAX_NAME_LENGTH } from '@shared/models/consts';

@Component({
  selector: 'spx-node-group-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    AutoSelectDirective,
    MatButtonModule,
    TitleCasePipe,
  ],
  templateUrl: './node-group-form.component.html',
  styleUrl: './node-group-form.component.scss',
})
export class NodeGroupFormComponent {
  readonly MaxReplicas = 10;
  readonly MaxNodeGroups = 5;
  readonly CpuValueList = CPU_VALUE_LIST;
  readonly MemoryValueList = MEMORY_VALUE_LIST;
  readonly maxLength = MAX_NAME_LENGTH;

  index = input.required<number>();
  group = input.required<AbstractControl>();
  storageClassList = input.required<string[]>();

  formGroup = computed(() => {
    return this.group() as FormGroup;
  });

  removeGroup = output<number>();
}
