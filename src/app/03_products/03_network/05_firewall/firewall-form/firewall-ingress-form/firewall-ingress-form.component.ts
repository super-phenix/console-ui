import { Component, input, OnInit, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IngressRule } from '@products/00_shared/models/network/firewall/create-firewall.model';
import { NetworkRuleFormComponent } from '../network-rule-form/network-rule-form.component';

@Component({
  selector: 'spx-firewall-ingress-form',
  imports: [NetworkRuleFormComponent, MatButtonModule, MatIconModule],
  templateUrl: './firewall-ingress-form.component.html',
})
export class FirewallIngressFormComponent implements OnInit {
  rules = signal<IngressRule[]>([]);

  initRules = input<IngressRule[]>();
  rulesChange = output<IngressRule[]>();
  isValid = output<boolean>();

  ngOnInit(): void {
    const init = this.initRules();
    if (init && init.length > 0) {
      this.rules.set([...init]);
    }
    this.updateOutput();
  }

  addRule() {
    this.rules.update(v => [...v, { from: [], ports: [] }]);
    this.updateOutput();
  }

  removeRule(index: number) {
    this.rules.update(l => {
      const copy = [...l];
      copy.splice(index, 1);
      return copy;
    });
    this.updateOutput();
  }

  updateOutput() {
    const rules = [...this.rules()];
    let valid = true;

    if (rules.length > 0) {
      valid = rules.every(r => this.isRuleValid(r));
    }

    this.rulesChange.emit(rules);
    this.isValid.emit(valid);
  }

  private isRuleValid(rule: IngressRule): boolean {
    if (rule.denyAll || rule.allowAll) {
      return true;
    } else if (rule.ports && rule.ports.length > 0) {
      return true;
    } else if (rule.from && rule.from.length > 0) {
      return true;
    }
    return false;
  }
}
