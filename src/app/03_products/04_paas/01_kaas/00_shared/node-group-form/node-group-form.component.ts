import { TitleCasePipe } from '@angular/common';
import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AutoSelectDirective } from '@shared/directives/auto-select.directive';
import { ComputeSizeFieldComponent } from '@products/00_shared/components/compute-size-field/compute-size-field.component';
import { MemorySizeFieldComponent } from '@products/00_shared/components/memory-size-field/memory-size-field.component';
import { CPU_SIZE, MemoryValue } from '@products/00_shared/models/compute/instance/instance';
import { REPLICAS_MAX, REPLICAS_MIN } from '@products/00_shared/models/paas/kaas/kaas';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { NODE_GROUP_NAME_MAX_LENGTH } from './node-group-name.validator';
import { NODE_ROLE_MAX_LENGTH } from './node-role.validator';

@Component({
  selector: 'spx-node-group-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    AutoSelectDirective,
    MatButtonModule,
    MatCheckboxModule,
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
  readonly nameMaxLength = NODE_GROUP_NAME_MAX_LENGTH;
  readonly nodeRoleMaxLength = NODE_ROLE_MAX_LENGTH;
  readonly replicasMin = REPLICAS_MIN;
  readonly replicasMax = REPLICAS_MAX;

  index = input.required<number>();
  group = input.required<AbstractControl>();
  storageClassList = input.required<string[]>();

  formGroup = computed(() => {
    return this.group() as FormGroup;
  });

  nameControl = computed(() => this.formGroup().get('name') as FormControl<string>);
  nodeRoleControl = computed(() => this.formGroup().get('nodeRole') as FormControl<string>);

  // The name the group was created with, read once on first render.
  defaultName = computed(() => this.nameControl().value);

  // The role input is shown when the group has a role other than its name.
  customRole = linkedSignal(() => !!this.nodeRoleControl().value);

  replicasControl = computed(() => this.formGroup().get('replicas') as FormControl<number>);
  cpuControl = computed(() => this.formGroup().get('cpu') as FormControl<number>);
  memoryControl = computed(() => this.formGroup().get('memory') as FormControl<MemoryValue>);

  removeGroup = output<number>();

  /** An emptied name falls back to the name the group was created with. */
  restoreDefaultName() {
    if (!this.nameControl().value) {
      this.nameControl().setValue(this.defaultName());
    }
  }

  toggleCustomRole(checked: boolean) {
    this.customRole.set(checked);
    if (!checked) {
      this.nodeRoleControl().setValue('');
    }
  }
}
