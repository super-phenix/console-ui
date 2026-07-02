import { transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatchExpressionComponent } from '@products/00_shared/components/match-expression/match-expression.component';
import { MatchLabelComponent } from '@products/00_shared/components/match-label/match-label.component';
import { LabelSelectorSyntaxHelperDialog } from '@products/00_shared/dialogs/label-selector-syntax-helper-dialog.component';
import { MatchExpression, MatchLabel, Peer } from '@products/00_shared/models/common.model';
import { IsIPinRange } from '@products/00_shared/utils/ip';
import { ipValidator } from '@shared/utils/validators';

@Component({
  selector: 'spx-peer-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatchLabelComponent,
    MatchExpressionComponent,
  ],
  templateUrl: './peer-form.component.html',
  styleUrl: './peer-form.component.scss',
})
export class PeerFormComponent implements OnInit {
  private dialog = inject(MatDialog);

  podSelection = signal(true);
  podMatchLabels = signal<MatchLabel[]>([]);
  podMatchExpressions = signal<MatchExpression[]>([]);

  ipBlock = signal(false);
  cidr = signal('');
  exceptions = signal<string[]>([]);
  exceptControl = new FormControl<string>('', [Validators.required, ipValidator(), this.ipInRangeValidator()]);

  readonly init = input<Peer>();

  peer = output<Peer>();

  ngOnInit() {
    if (this.init()) {
      const ps = this.init()?.podSelector;
      console.log(ps);

      const ipb = this.init()?.ipBlock;

      if (ps?.matchExpressions || ps?.matchLabels) {
        this.podSelection.set(true);
        this.podMatchLabels.set(ps.matchLabels || []);
        this.podMatchExpressions.set(ps.matchExpressions || []);
      } else {
        if (ipb) {
          this.podSelection.set(false);
        }
      }

      if (ipb) {
        this.ipBlock.set(true);
        this.cidr.set(ipb.cidr);
        this.exceptions.set(ipb.except || []);
      }
    }
  }

  addValue() {
    if (this.exceptControl.value) {
      const list = [...this.exceptions()];
      list.push(this.exceptControl.value);

      this.exceptions.set(list);
      this.exceptControl.reset('');
      this.updateOutput();
    }
  }

  /**
   * Remove an item by it's index in the list
   */
  removeItemByIndex(index: number, array: string[]) {
    transferArrayItem(array, [], index, 0);
    this.exceptions.set(array);
    this.updateOutput();
  }

  updateCidr(value: string) {
    this.cidr.set(value);
    this.exceptControl.updateValueAndValidity();
    this.updateOutput();
  }

  updateOutput() {
    const result: Peer = {};

    const matchExpressions = this.podMatchExpressions();
    const matchLabels = this.podMatchLabels();

    if (this.podSelection()) {
      result.podSelector = {
        matchExpressions: [...matchExpressions],
        matchLabels: [...matchLabels],
      };
    } else {
      result.podSelector = undefined;
    }

    if (this.ipBlock()) {
      result.ipBlock = {
        cidr: this.cidr(),
        except: [...this.exceptions()],
      };
    } else {
      result.ipBlock = undefined;
    }

    this.peer.emit(result);
  }

  ipInRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const ip = control.value;
      if (!ip) {
        return null;
      }

      if (this.cidr()) {
        console.log(this.cidr(), ip);

        const isIPinAnyRange = IsIPinRange(this.cidr(), ip);
        return isIPinAnyRange ? null : { ipRange: true };
      } else {
        return null;
      }
    };
  }

  openHelper() {
    this.dialog.open(LabelSelectorSyntaxHelperDialog);
  }
}
