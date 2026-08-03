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
  CreateSecurityGroup,
  EgressRule,
  SecurityGroupCreationSpec,
  IngressRule,
} from '@products/00_shared/models/network/security-group/create-security-group.model';
import { PeerMapToArray } from '@products/00_shared/models/network/security-group/security-group.model';
import { AZService } from '@products/00_shared/services/az.service';
import { SecurityGroupService } from '@products/00_shared/services/security-group.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';
import { SecurityGroupTargetFormComponent } from '../security-group-form/security-group-target-form/security-group-target-form.component';
import { SecurityGroupIngressFormComponent } from '../security-group-form/security-group-ingress-form/security-group-ingress-form.component';
import { SecurityGroupEgressFormComponent } from '../security-group-form/security-group-egress-form/security-group-egress-form.component';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';

@Component({
  selector: 'spx-security-group-update',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatStepperModule,
    ContentHeaderComponent,
    SecurityGroupTargetFormComponent,
    SecurityGroupIngressFormComponent,
    SecurityGroupEgressFormComponent,
    StepGeneralComponent,
  ],
  templateUrl: './security-group-update.component.html',
  styleUrl: './security-group-update.component.scss',
})
export class SecurityGroupUpdateComponent {
  private fb = inject(FormBuilder);
  protected sgService = inject(SecurityGroupService);
  protected stateSvc = inject(StateService);
  protected azSvc = inject(AZService);
  protected route = inject(ActivatedRoute);
  protected location = inject(Location);
  protected router = inject(Router);

  protected az;
  protected eid;

  maxLength = MAX_NAME_LENGTH;

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    description: this.fb.control(''),
  });

  initSpec = signal<SecurityGroupCreationSpec>({});

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
    if (this.az && this.eid && permissionSvc.permissions().includes(PermissionsEnum.ProjectSecurityGroupWrite)) {
      this.loadSecurityGroup();
    } else {
      this.location.back();
    }
  }

  loadSecurityGroup() {
    this.sgService
      .get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az, this.eid)
      .subscribe(res => {
        if (res.securityGroup) {
          const specs = res.securityGroup.spec;
          const securityGroupSpec: SecurityGroupCreationSpec = {};

          this.firstFormGroup.reset({
            productName: res.productName,
            description: res.securityGroup.description,
          });

          if (specs.podSelector) {
            const labels: MatchLabel[] = [];

            if (specs.podSelector.matchLabels) {
              Object.entries(specs.podSelector.matchLabels).forEach(([key, value]) => {
                labels.push({ key, value });
              });
            }

            securityGroupSpec.target = {
              matchLabels: labels,
              matchExpressions: specs.podSelector.matchExpressions,
            };
          }

          if (specs.policyTypes.includes('Ingress')) {
            if (specs.ingress == undefined) {
              securityGroupSpec.ingress = [
                {
                  denyAll: true,
                },
              ];
            } else if (specs.ingress.findIndex(v => Object.getOwnPropertyNames(v).length === 0) !== -1) {
              securityGroupSpec.ingress = [
                {
                  allowAll: true,
                },
              ];
            } else {
              securityGroupSpec.ingress = [];
              specs.ingress.forEach(inRule => {
                securityGroupSpec.ingress!.push({
                  ports: inRule.ports,
                  from: PeerMapToArray(inRule.from),
                });
              });
            }
          }

          if (specs.policyTypes.includes('Egress')) {
            if (specs.egress == undefined) {
              securityGroupSpec.egress = [
                {
                  denyAll: true,
                },
              ];
            } else if (specs.egress.findIndex(v => Object.getOwnPropertyNames(v).length === 0) !== -1) {
              securityGroupSpec.egress = [
                {
                  allowAll: true,
                },
              ];
            } else {
              securityGroupSpec.egress = [];
              specs.egress.forEach(inRule => {
                securityGroupSpec.egress!.push({
                  ports: inRule.ports,
                  to: PeerMapToArray(inRule.to),
                });
              });
            }
          }

          this.initSpec.set(securityGroupSpec);
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

      await firstValueFrom(
        this.sgService.update(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.az,
          this.eid,
          securityGroup
        )
      );
      this.router.navigate(['/products', 'network', 'security-group', 'details', this.az, this.eid]);
    }
  }
}
