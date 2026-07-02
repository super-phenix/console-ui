import { Component, input, OnInit, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EgressRule } from '@products/00_shared/models/network/firewall/create-firewall.model';
import { NetworkRuleFormComponent } from '../network-rule-form/network-rule-form.component';

@Component({
  selector: 'spx-firewall-egress-form',
  imports: [NetworkRuleFormComponent, MatButtonModule, MatIconModule],
  templateUrl: './firewall-egress-form.component.html',
})
export class FirewallEgressFormComponent implements OnInit {
  rules = signal<EgressRule[]>([]);

  initRules = input<EgressRule[]>();
  rulesChange = output<EgressRule[]>();
  isValid = output<boolean>();

  ngOnInit(): void {
    const init = this.initRules();
    if (init && init.length > 0) {
      this.rules.set([...init]);
    }
    this.updateOutput();
  }

  addRule() {
    this.rules.update(v => [...v, { to: [], ports: [] }]);
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

  private isRuleValid(rule: EgressRule): boolean {
    if (rule.denyAll || rule.allowAll) {
      return true;
    } else if (rule.ports && rule.ports.length > 0) {
      return true;
    } else if (rule.to && rule.to.length > 0) {
      return true;
    }
    return false;
  }
}
