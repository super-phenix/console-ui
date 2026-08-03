import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateSecurityGroup,
  EgressRule,
  IngressRule,
} from '@products/00_shared/models/network/security-group/create-security-group.model';
import { LabelSelector } from '@products/00_shared/models/common.model';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { StateService } from '@shared/services/state.service';
import { SecurityGroupTargetFormComponent } from '../security-group-form/security-group-target-form/security-group-target-form.component';
import { SecurityGroupIngressFormComponent } from '../security-group-form/security-group-ingress-form/security-group-ingress-form.component';
import { SecurityGroupEgressFormComponent } from '../security-group-form/security-group-egress-form/security-group-egress-form.component';
import { firstValueFrom } from 'rxjs';
import { SecurityGroupService } from '@products/00_shared/services/security-group.service';

@Component({
  selector: 'spx-security-group-create',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatStepperModule,
    ContentHeaderComponent,
    StepGeneralComponent,
    SecurityGroupTargetFormComponent,
    SecurityGroupIngressFormComponent,
    SecurityGroupEgressFormComponent,
  ],
  templateUrl: './security-group-create.component.html',
  styleUrl: './security-group-create.component.scss',
})
export class SecurityGroupCreateComponent {
  private fb = inject(FormBuilder);
  protected sgService = inject(SecurityGroupService);
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
      const securityGroup = new CreateSecurityGroup({
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
        this.sgService.create(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.selectedAz()!,
          securityGroup
        )
      );
      this.router.navigate(['..', 'details', this.selectedAz(), created.eid], { relativeTo: this.route });
    }
  }
}
