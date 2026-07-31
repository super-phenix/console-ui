import { Component, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AutoSelectDirective } from '@shared/directives/auto-select.directive';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { CreateSubnet } from '@products/00_shared/models/network/subnet/create-subnet.model';
import { ProtocolEnum } from '@products/00_shared/models/network/subnet/protocol.enum';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { VPCService } from '@products/00_shared/services/vpc.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom, of } from 'rxjs';

@Component({
  selector: 'spx-subnet-create',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    MatSelectModule,
    AutoSelectDirective,
    MatChipsModule,
    MatStepperModule,
    MatIconModule,
    MatSlideToggleModule,
    ContentHeaderComponent,
    StepGeneralComponent,
  ],
  templateUrl: './subnet-create.component.html',
  styleUrl: './subnet-create.component.scss',
})
export class SubnetCreateComponent {
  protected stateSvc = inject(StateService);
  protected subnetSvc = inject(SubnetService);
  protected vpcSvc = inject(VPCService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private fb = inject(FormBuilder);
  ProtocolEnum = ProtocolEnum;
  ProtocolList = Object.keys(ProtocolEnum) as ProtocolEnum[];
  maxLength = MAX_NAME_LENGTH;

  vpcEid = this.route.snapshot.queryParamMap.get('vpcEid') ?? '';
  az = this.route.snapshot.queryParamMap.get('az') ?? '';

  selectedAz = signal<string | null>(null);

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control(this.az, Validators.required),

    private: this.fb.nonNullable.control(false),
    natGateway: this.fb.nonNullable.control(false),
  });

  secondFormGroup = this.fb.nonNullable.group({
    vpcEId: this.fb.nonNullable.control(this.vpcEid, Validators.required),
    protocol: this.fb.nonNullable.control(ProtocolEnum.IPv4, Validators.required),

    ipv4: this.fb.control('', Validators.required),
    ipv6: this.fb.control(''),

    showDnsOptions: this.fb.control<boolean>(false),
    dnsV4: this.fb.control(null),
    dnsV6: this.fb.control(null),
  });


  vpcResource = rxResource({
    params: () => ({ az: this.selectedAz() }),
    stream: ({ params }) => {
      if (params.az && params.az !== '' && this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.vpcSvc.listByAZ(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, params.az);
      } else {
        return of([]);
      }
    },
  });

  constructor() {
    if (this.az) {
      this.selectedAz.set(this.az);
    }

    this.secondFormGroup
      .get('protocol')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(v => {
        switch (v) {
          case ProtocolEnum.Dual:
            this.secondFormGroup.get('ipv4')?.addValidators(Validators.required);
            this.secondFormGroup.get('ipv6')?.addValidators(Validators.required);
            break;
          case ProtocolEnum.IPv4:
            this.secondFormGroup.get('ipv4')?.addValidators(Validators.required);
            this.secondFormGroup.get('ipv6')?.removeValidators(Validators.required);
            break;
          case ProtocolEnum.IPv6:
            this.secondFormGroup.get('ipv6')?.addValidators(Validators.required);
            this.secondFormGroup.get('ipv4')?.removeValidators(Validators.required);
            break;
        }
        this.secondFormGroup.get('ipv4')?.updateValueAndValidity();
        this.secondFormGroup.get('ipv6')?.updateValueAndValidity();
      });

    this.secondFormGroup
      .get('showDnsOptions')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(show => {
        if (!show) {
          this.secondFormGroup.get('dnsV4')?.reset(null);
          this.secondFormGroup.get('dnsV6')?.reset(null);
        }
      });
  }

  azChange(value: string) {
    this.selectedAz.set(value);
    this.secondFormGroup.get('vpcEId')?.reset();
  }

  async create() {
    if (this.firstFormGroup.valid && this.secondFormGroup.valid && this.selectedAz()) {
      const firstValues = this.firstFormGroup.value;
      const secondValues = this.secondFormGroup.value;

      const body: CreateSubnet = {
        general: {
          productName: firstValues.productName!,
          vpcEId: secondValues.vpcEId!,
        },
        network: {
          private: firstValues.private!,
          protocol: secondValues.protocol!,
          ipv4: secondValues.ipv4 || null,
          ipv6: secondValues.ipv6 || null,
          dnsV4: secondValues.dnsV4 || null,
          dnsV6: secondValues.dnsV6 || null,
        },
        natGateway: {
          enable: firstValues.natGateway || false,
        },
      };

      const created = await firstValueFrom(
        this.subnetSvc.create(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz()!, body)
      );
      this.router.navigate(['..', 'details', this.selectedAz(), created.eid], { relativeTo: this.route });
    }
  }
}
