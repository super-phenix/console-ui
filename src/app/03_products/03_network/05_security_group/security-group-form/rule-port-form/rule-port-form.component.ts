import { transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, inject, model } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { SgRulePort } from '@products/00_shared/models/network/security-group/security-group.model';

@Component({
  selector: 'spx-rule-port-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatChipsModule,
    MatIconModule,
  ],
  templateUrl: './rule-port-form.component.html',
  styleUrl: './rule-port-form.component.scss',
})
export class RulePortFormComponent {
  private fb = inject(FormBuilder);

  rulePorts = model<SgRulePort[]>([]);
  portForm = this.fb.group({
    port: this.fb.nonNullable.control<number>(1, [Validators.required, Validators.min(1), Validators.max(65535)]),
    endPort: this.fb.nonNullable.control<number>(1, [Validators.required, Validators.min(1), Validators.max(65535)]),
    protocol: new FormControl<'TCP' | 'UDP'>('TCP', [Validators.required]),
  });

  constructor() {
    this.portForm
      .get('port')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(v => {
        const end = this.portForm.get('endPort')?.value || 1;
        if (v > end) {
          this.portForm.get('endPort')?.setValue(v);
        }
      });
  }

  addPort() {
    if (this.portForm.valid) {
      const list = this.rulePorts();
      const port = this.portForm.get('port')!.value!;
      const endPort = this.portForm.get('endPort')!.value!;
      list.push({
        port: port,
        endPort: endPort,
        protocol: this.portForm.get('protocol')!.value!,
      });

      list.sort((a, b) => a.port - b.port);

      this.rulePorts.set(list);
      this.portForm.reset({
        port: 1,
        endPort: 1,
        protocol: 'TCP',
      });
    }
  }

  /**
   * Remove an item by it's index in the list
   */
  removeItemByIndex(index: number, array: SgRulePort[]) {
    transferArrayItem(array, [], index, 0);
    this.rulePorts.set(array);
  }
}
