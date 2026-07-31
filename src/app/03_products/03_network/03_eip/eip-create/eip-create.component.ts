import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { AutoSelectDirective } from '@shared/directives/auto-select.directive';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { EipSecondStepComponent } from '@products/03_network/03_eip/eip-second-step/eip-second-step.component';
import { CreateDnat, CreateEIP } from '@products/00_shared/models/network/eip/create-eip.model';
import { EipService } from '@products/00_shared/services/eip.service';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { StateService } from '@shared/services/state.service';
import { ipValidator } from '@shared/utils/validators';
import { firstValueFrom, map, of } from 'rxjs';

@Component({
  selector: 'spx-eip-create',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    AutoSelectDirective,
    MatRadioModule,
    MatChipsModule,
    MatIconModule,
    MatStepperModule,
    ContentHeaderComponent,
    StepGeneralComponent,
    EipSecondStepComponent,
  ],
  templateUrl: './eip-create.component.html',
  styleUrl: './eip-create.component.scss',
})
export class EipCreateComponent {
  protected stateSvc = inject(StateService);
  protected eipSvc = inject(EipService);
  protected subnetSvc = inject(SubnetService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private fb = inject(FormBuilder);
  maxLength = MAX_NAME_LENGTH;

  subnetEid = this.route.snapshot.queryParamMap.get('subnetEid') ?? '';
  az = this.route.snapshot.queryParamMap.get('az') ?? '';

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control(this.az, Validators.required),
    subnetEid: this.fb.nonNullable.control(this.subnetEid, Validators.required),
  });

  secondFormGroup = this.fb.group({
    type: this.fb.nonNullable.control<'ip' | 'cidr'>('ip', [Validators.required]),
    ip: this.fb.nonNullable.control<string>('', [Validators.required, ipValidator()]),
    snat: this.fb.array<string>([]),
    dnat: this.fb.array([]),
  });

  selectedAz = signal<string | null>(null);

  subnetsProduct = rxResource({
    params: () => this.selectedAz(),
    stream: () => {
      if (this.selectedAz() && this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.subnetSvc
          .listByAZ(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz()!)
          .pipe(map(subnets => subnets.filter(sub => sub.natGateway !== undefined)));
      } else {
        return of([]);
      }
    },
  });

  constructor() {
    if (this.az) {
      this.selectedAz.set(this.az);
    }
  }

  async create() {
    if (this.firstFormGroup.valid && this.secondFormGroup.valid && this.selectedAz()) {
      let createEIP: CreateEIP;
      if (this.secondFormGroup.value?.type === 'ip') {
        createEIP = {
          general: {
            productName: this.firstFormGroup.value.productName!,
            subnetEId: this.firstFormGroup.value.subnetEid!,
          },
          spec: {
            internalIP: this.secondFormGroup.value?.ip || null,
            snat: null,
            dnat: null,
          },
        };
      } else {
        createEIP = {
          general: {
            productName: this.firstFormGroup.value.productName!,
            subnetEId: this.firstFormGroup.value.subnetEid!,
          },
          spec: {
            internalIP: null,
            snat: (this.secondFormGroup.value?.snat as string[]) || null,
            dnat: (this.secondFormGroup.value?.dnat as CreateDnat[]) || null,
          },
        };
      }

      const created = await firstValueFrom(
        this.eipSvc.create(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz()!, createEIP)
      );
      this.router.navigate(['..', 'details', this.selectedAz(), created.eid], { relativeTo: this.route });
    }
  }
}
