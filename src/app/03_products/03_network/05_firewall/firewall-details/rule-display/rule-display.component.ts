import { KeyValuePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EgressRuleMap, IngressRuleMap } from '@products/00_shared/models/network/firewall/firewall.model';

@Component({
  selector: 'spx-rule-display',
  imports: [MatIconModule, KeyValuePipe],
  templateUrl: './rule-display.component.html',
  styleUrl: './rule-display.component.scss',
})
export class RuleDisplayComponent {
  ingress = input<IngressRuleMap>();
  egress = input<EgressRuleMap>();
}
