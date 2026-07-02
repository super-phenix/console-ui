import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateFirewall,
  EgressRule,
  IngressRule,
} from '@products/00_shared/models/network/firewall/create-firewall.model';
import { LabelSelector } from '@products/00_shared/models/common.model';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { StateService } from '@shared/services/state.service';
import { FirewallTargetFormComponent } from '../firewall-form/firewall-target-form/firewall-target-form.component';
import { FirewallIngressFormComponent } from '../firewall-form/firewall-ingress-form/firewall-ingress-form.component';
import { FirewallEgressFormComponent } from '../firewall-form/firewall-egress-form/firewall-egress-form.component';
import { firstValueFrom } from 'rxjs';
import { FirewallService } from '@products/00_shared/services/firewall.service';

@Component({
  selector: 'spx-firewall-create',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatStepperModule,
    ContentHeaderComponent,
    StepGeneralComponent,
    FirewallTargetFormComponent,
    FirewallIngressFormComponent,
    FirewallEgressFormComponent,
  ],
  templateUrl: './firewall-create.component.html',
  styleUrl: './firewall-create.component.scss',
})
export class FirewallCreateComponent {
  private fb = inject(FormBuilder);
  protected fwService = inject(FirewallService);
  protected stateSvc = inject(StateService);
  protected route = inject(ActivatedRoute);
  protected router = inject(Router);

  maxLength = MAX_NAME_LENGTH;

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
    description: this.fb.control(''),
  });

  selectedAz = signal<string | null>(null);

  target = signal<LabelSelector>({ matchLabels: [], matchExpressions: [] });
  isTargetValid = signal(true);

  ingressRules = signal<IngressRule[]>([]);
  isIngressValid = signal(true);

  egressRules = signal<EgressRule[]>([]);
  isEgressValid = signal(true);

  async create() {
    if (
      this.firstFormGroup.valid &&
      this.isTargetValid() &&
      this.isIngressValid() &&
      this.isEgressValid() &&
      this.selectedAz()
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

      const created = await firstValueFrom(
        this.fwService.create(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.selectedAz()!,
          firewall
        )
      );
      this.router.navigate(['..', 'details', this.selectedAz(), created.eid], { relativeTo: this.route });
    }
  }
}
