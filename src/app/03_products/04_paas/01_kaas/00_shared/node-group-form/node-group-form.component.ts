import { TitleCasePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AutoSelectDirective } from '@shared/directives/auto-select.directive';
import { ComputeSizeFieldComponent } from '@products/00_shared/components/compute-size-field/compute-size-field.component';
import { MemorySizeFieldComponent } from '@products/00_shared/components/memory-size-field/memory-size-field.component';
import { CPU_SIZE, MemoryValue } from '@products/00_shared/models/compute/instance/instance';
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
    ComputeSizeFieldComponent,
    MemorySizeFieldComponent,
  ],
  templateUrl: './node-group-form.component.html',
  styleUrl: './node-group-form.component.scss',
})
export class NodeGroupFormComponent {
  readonly MaxNodeGroups = 5;
  readonly CpuSize = CPU_SIZE;
  readonly maxLength = MAX_NAME_LENGTH;

  index = input.required<number>();
  group = input.required<AbstractControl>();
  storageClassList = input.required<string[]>();

  formGroup = computed(() => {
    return this.group() as FormGroup;
  });

  replicasControl = computed(() => this.formGroup().get('replicas') as FormControl<number>);
  cpuControl = computed(() => this.formGroup().get('cpu') as FormControl<number>);
  memoryControl = computed(() => this.formGroup().get('memory') as FormControl<MemoryValue>);

  removeGroup = output<number>();
}
