import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { LabelSelector, MatchLabel } from '@products/00_shared/models/common.model';
import {
  CreateFirewall,
  EgressRule,
  FirewallCreationSpec,
  IngressRule,
} from '@products/00_shared/models/network/firewall/create-firewall.model';
import { PeerMapToArray } from '@products/00_shared/models/network/firewall/firewall.model';
import { ProductFirewall } from '@products/00_shared/models/product.model';
import { AZService } from '@products/00_shared/services/az.service';
import { FirewallService } from '@products/00_shared/services/firewall.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';
import { FirewallTargetFormComponent } from '../firewall-form/firewall-target-form/firewall-target-form.component';
import { FirewallIngressFormComponent } from '../firewall-form/firewall-ingress-form/firewall-ingress-form.component';
import { FirewallEgressFormComponent } from '../firewall-form/firewall-egress-form/firewall-egress-form.component';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';

@Component({
  selector: 'spx-firewall-update',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatStepperModule,
    ContentHeaderComponent,
    FirewallTargetFormComponent,
    FirewallIngressFormComponent,
    FirewallEgressFormComponent,
    StepGeneralComponent,
  ],
  templateUrl: './firewall-update.component.html',
  styleUrl: './firewall-update.component.scss',
})
export class FirewallUpdateComponent {
  private fb = inject(FormBuilder);
  protected fwService = inject(FirewallService);
  protected stateSvc = inject(StateService);
  protected azSvc = inject(AZService);
  protected route = inject(ActivatedRoute);
  protected location = inject(Location);
  protected router = inject(Router);

  protected az;
  protected eid;
  lb = signal<ProductFirewall | undefined>(undefined);

  maxLength = MAX_NAME_LENGTH;

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    description: this.fb.control(''),
  });

  initSpec = signal<FirewallCreationSpec>({});

  target = signal<LabelSelector>({ matchLabels: [], matchExpressions: [] });
  isTargetValid = signal(true);

  ingressRules = signal<IngressRule[]>([]);
  isIngressValid = signal(true);

  egressRules = signal<EgressRule[]>([]);
  isEgressValid = signal(true);

  isLoaded = signal(false);

  constructor() {
    const route = inject(ActivatedRoute);
    const permissionSvc = inject(PermissionService);

    this.az = route.snapshot.paramMap.get('az') || '';
    this.eid = route.snapshot.paramMap.get('id') || '';
    if (this.az && this.eid && permissionSvc.permissions().includes(PermissionsEnum.ProjectFirewallWrite)) {
      this.loadFirewall();
    } else {
      this.location.back();
    }
  }

  loadFirewall() {
    this.fwService
      .get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az, this.eid)
      .subscribe(res => {
        if (res.firewall) {
          const specs = res.firewall.spec;
          const firewallSpec: FirewallCreationSpec = {};

          this.firstFormGroup.reset({
            productName: res.productName,
            description: res.firewall.description,
          });

          if (specs.podSelector) {
            const labels: MatchLabel[] = [];

            if (specs.podSelector.matchLabels) {
              Object.entries(specs.podSelector.matchLabels).forEach(([key, value]) => {
                labels.push({ key, value });
              });
            }

            firewallSpec.target = {
              matchLabels: labels,
              matchExpressions: specs.podSelector.matchExpressions,
            };
          }

          if (specs.policyTypes.includes('Ingress')) {
            if (specs.ingress == undefined) {
              firewallSpec.ingress = [
                {
                  denyAll: true,
                },
              ];
            } else if (specs.ingress.findIndex(v => Object.getOwnPropertyNames(v).length === 0) !== -1) {
              firewallSpec.ingress = [
                {
                  allowAll: true,
                },
              ];
            } else {
              firewallSpec.ingress = [];
              specs.ingress.forEach(inRule => {
                firewallSpec.ingress!.push({
                  ports: inRule.ports,
                  from: PeerMapToArray(inRule.from),
                });
              });
            }
          }

          if (specs.policyTypes.includes('Egress')) {
            if (specs.egress == undefined) {
              firewallSpec.egress = [
                {
                  denyAll: true,
                },
              ];
            } else if (specs.egress.findIndex(v => Object.getOwnPropertyNames(v).length === 0) !== -1) {
              firewallSpec.egress = [
                {
                  allowAll: true,
                },
              ];
            } else {
              firewallSpec.egress = [];
              specs.egress.forEach(inRule => {
                firewallSpec.egress!.push({
                  ports: inRule.ports,
                  to: PeerMapToArray(inRule.to),
                });
              });
            }
          }

          this.initSpec.set(firewallSpec);
          this.isLoaded.set(true);
        }
      });
  }

  async update() {
    if (
      this.firstFormGroup.valid &&
      this.isTargetValid() &&
      this.isIngressValid() &&
      this.isEgressValid() &&
      this.az &&
      this.eid
    ) {
      const formValue = this.firstFormGroup.getRawValue();
      const firewall = new CreateFirewall({
        general: {
          productName: formValue.productName,
          description: formValue.description,
        },
        spec: {
          target: this.target(),
          ingress: this.ingressRules(),
          egress: this.egressRules(),
        },
      });

      await firstValueFrom(
        this.fwService.update(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.az,
          this.eid,
          firewall
        )
      );
      this.router.navigate(['/products', 'network', 'firewall', 'details', this.az, this.eid]);
    }
  }
}
