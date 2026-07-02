import { KeyValuePipe } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators, ɵInternalFormsSharedModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Peer } from '@products/00_shared/models/common.model';
import { EgressRule, IngressRule } from '@products/00_shared/models/network/firewall/create-firewall.model';
import { FwRulePort } from '@products/00_shared/models/network/firewall/firewall.model';
import { RuleTemplateEnum } from '@products/00_shared/models/network/firewall/rule-template';
import {
  PeerFormDataDialog,
  PeerFormDialog,
} from '@products/03_network/05_firewall/firewall-form/dialogs/peer-form-dialog.component';
import {
  RulePortFormDataDialog,
  RulePortFormDialog,
} from '@products/03_network/05_firewall/firewall-form/dialogs/rule-port-form-dialog.component';

@Component({
  selector: 'spx-network-rule-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    ɵInternalFormsSharedModule,
    KeyValuePipe,
  ],
  templateUrl: './network-rule-form.component.html',
  styleUrl: './network-rule-form.component.scss',
})
export class NetworkRuleFormComponent implements OnInit {
  private dialog = inject(MatDialog);

  RuleTemplateEnum = RuleTemplateEnum;
  templateSelection = new FormControl<RuleTemplateEnum>(RuleTemplateEnum.AllowAll, Validators.required);

  rulePorts = signal<FwRulePort[]>([]);
  peerList = signal<Peer[]>([]);

  type = input.required<'ingress' | 'egress'>();
  rule = input<IngressRule | EgressRule>();
  ruleChange = output<IngressRule | EgressRule>();

  ngOnInit(): void {
    if (this.rule()) {
      const rule = this.rule()!;

      if (rule.denyAll) {
        this.templateSelection.reset(RuleTemplateEnum.DenyAll);
      } else if (rule.allowAll) {
        this.templateSelection.reset(RuleTemplateEnum.AllowAll);
      } else {
        let isCustom = false;
        if (rule.ports && rule.ports.length > 0) {
          this.rulePorts.set([...rule.ports]);
          isCustom = true;
        }
        if (this.type() === 'ingress') {
          if ('from' in rule && rule.from && rule.from.length > 0) {
            this.peerList.set([...rule.from]);
            isCustom = true;
          }
        }
        if (this.type() === 'egress') {
          if ('to' in rule && rule.to && rule.to.length > 0) {
            this.peerList.set([...rule.to]);
            isCustom = true;
          }
        }

        if (isCustom) {
          this.templateSelection.reset(RuleTemplateEnum.AllowSpecific);
        }
      }
    }
    this.updateOutput();
  }

  definePorts() {
    const ref = this.dialog.open<RulePortFormDialog, RulePortFormDataDialog>(RulePortFormDialog, {
      data: {
        rules: this.rulePorts(),
      },
      width: '500px',
    });

    ref.afterClosed().subscribe(res => {
      if (res) {
        this.rulePorts.set(res);
      }
      this.updateOutput();
    });
  }

  updatePeer(index?: number) {
    const toUpdate = index != undefined ? this.peerList()[index] : {};
    const ref = this.dialog.open<PeerFormDialog, PeerFormDataDialog>(PeerFormDialog, {
      data: {
        title: index != undefined ? 'Edit' : 'Add',
        action: index != undefined ? 'Edit' : 'Add',
        peer: toUpdate,
      },
      width: '500px',
    });

    ref.afterClosed().subscribe(res => {
      if (res) {
        if (index != undefined) {
          const list = [...this.peerList()];
          list[index] = res;
          this.peerList.set(list);
        } else {
          const list = [...this.peerList()];
          list.push(res);
          this.peerList.set(list);
        }
      }
      this.updateOutput();
    });
  }

  removePeer(index: number) {
    this.peerList.update(l => {
      l.splice(index, 1);
      return l;
    });
    this.updateOutput();
  }

  updateOutput() {
    if (this.templateSelection.value === RuleTemplateEnum.AllowAll) {
      this.ruleChange.emit({
        allowAll: true,
      });
    } else if (this.templateSelection.value === RuleTemplateEnum.DenyAll) {
      this.ruleChange.emit({
        denyAll: true,
      });
    } else if (this.type() === 'egress') {
      this.ruleChange.emit({
        ports: [...this.rulePorts()],
        to: [...this.peerList()],
      });
    } else if (this.type() === 'ingress') {
      this.ruleChange.emit({
        ports: [...this.rulePorts()],
        from: [...this.peerList()],
      });
    }
  }
}
