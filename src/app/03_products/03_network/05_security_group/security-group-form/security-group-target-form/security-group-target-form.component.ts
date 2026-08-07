import { Component, input, OnInit, output, signal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { StepLabelComponent } from '@products/00_shared/components/forms-step/step-label/step-label.component';
import { MatchExpressionComponent } from '@products/00_shared/components/match-expression/match-expression.component';
import { LabelSelector, MatchExpression, MatchLabel } from '@products/00_shared/models/common.model';

@Component({
  selector: 'spx-security-group-target-form',
  imports: [MatchExpressionComponent, MatCheckboxModule, MatIconModule, StepLabelComponent],
  templateUrl: './security-group-target-form.component.html',
})
export class SecurityGroupTargetFormComponent implements OnInit {
  matchLabelsEnabled = signal(false);
  matchLabels = signal<string[]>([]);
  matchExpressionsEnabled = signal(false);
  matchExpressions = signal<MatchExpression[]>([]);

  initTarget = input<LabelSelector>();
  targetChange = output<LabelSelector>();
  isValid = output<boolean>();

  ngOnInit(): void {
    const init = this.initTarget();
    if (init) {
      if (init.matchLabels && init.matchLabels.length > 0) {
        const matchLabels = init.matchLabels.map(v => v.key + ':' + v.value);
        this.matchLabels.set(matchLabels);
        this.matchLabelsEnabled.set(true);
      }
      if (init.matchExpressions && init.matchExpressions.length > 0) {
        this.matchExpressions.set(init.matchExpressions);
        this.matchExpressionsEnabled.set(true);
      }
    }
    this.updateOutput();
  }

  updateLabels(value: string[]) {
    this.matchLabels.set([...value]);
    this.updateOutput();
  }

  updateOutput() {
    const matchLabels = this.matchLabels().map((v): MatchLabel => {
      const splitLabel = v.split(':');
      return {
        key: splitLabel[0],
        value: splitLabel[1],
      };
    });

    const target: LabelSelector = {
      matchLabels: this.matchLabelsEnabled() ? [...matchLabels] : [],
      matchExpressions: this.matchExpressionsEnabled() ? [...this.matchExpressions()] : [],
    };

    let valid = true;

    if (this.matchLabelsEnabled() && target.matchLabels && target.matchLabels.length === 0) {
      valid = false;
    }
    if (this.matchExpressionsEnabled() && target.matchExpressions && target.matchExpressions.length === 0) {
      valid = false;
    }

    console.log(target);

    this.targetChange.emit(target);
    this.isValid.emit(valid);
  }
}
