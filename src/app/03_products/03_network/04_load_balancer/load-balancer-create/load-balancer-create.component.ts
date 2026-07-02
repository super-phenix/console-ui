import { transferArrayItem } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { StepLabelComponent } from '@products/00_shared/components/forms-step/step-label/step-label.component';
import { LBTypeEnum } from '@products/00_shared/models/network/load-balancer/consts';
import { CreateLoadBalancer } from '@products/00_shared/models/network/load-balancer/create-load-balancer.model';
import { RulePort } from '@products/00_shared/models/network/load-balancer/load-balancer.model';
import { AZService } from '@products/00_shared/services/az.service';
import { LoadBalancerService } from '@products/00_shared/services/load-balancer.service';
import { IsIPinRange } from '@products/00_shared/utils/ip';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { MAX_NAME_LENGTH, VIRTUAL_IP_RANGE } from '@shared/models/consts';
import { StateService } from '@shared/services/state.service';
import { ipValidator, ipv4Validator } from '@shared/utils/validators';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'spx-load-balancer-create',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatChipsModule,
    MatIconModule,
    MatStepperModule,
    ContentHeaderComponent,
    StepGeneralComponent,
    StepLabelComponent,
  ],
  templateUrl: './load-balancer-create.component.html',
  styleUrl: './load-balancer-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadBalancerCreateComponent {
  private fb = inject(FormBuilder);
  protected lbService = inject(LoadBalancerService);
  protected stateSvc = inject(StateService);
  protected azSvc = inject(AZService);
  protected route = inject(ActivatedRoute);
  protected router = inject(Router);

  LBTypeEnum = LBTypeEnum;
  readonly VIRTUAL_IP_RANGE = VIRTUAL_IP_RANGE;

  maxLength = MAX_NAME_LENGTH;

  firstFormGroup = this.fb.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
    vip: this.fb.nonNullable.control('', [Validators.required, ipValidator(), this.ipInRangeValidator()]),
  });

  secondFormGroup = this.fb.group({
    type: new FormControl<LBTypeEnum.Selector | LBTypeEnum.Endpoint>(LBTypeEnum.Selector, [Validators.required]),
    selectors: this.fb.nonNullable.control<string[]>([], [Validators.required]),
    endpoints: this.fb.nonNullable.control<string[]>([]),
    ports: this.fb.nonNullable.control<RulePort[]>([], [Validators.required]),
  });

  portList: RulePort[] = [];
  portForm = this.fb.group({
    port: this.fb.nonNullable.control('', [Validators.required]),
    targetPort: this.fb.nonNullable.control('', [Validators.required]),
    protocol: new FormControl<'TCP' | 'UDP'>('TCP', [Validators.required]),
  });

  endpointsList: string[] = [];
  endpointsForm = this.fb.group({
    value: new FormControl<string>('', [Validators.required, ipv4Validator()]),
  });

  labelsSelector = signal<string[]>([]);

  constructor() {
    this.secondFormGroup
      .get('type')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(v => {
        if (v === LBTypeEnum.Selector) {
          this.secondFormGroup.get('endpoints')?.removeValidators(Validators.required);
          this.secondFormGroup.get('selectors')?.addValidators(Validators.required);
        } else if (v === LBTypeEnum.Endpoint) {
          this.secondFormGroup.get('selectors')?.removeValidators(Validators.required);
          this.secondFormGroup.get('endpoints')?.addValidators(Validators.required);
        }

        this.secondFormGroup.get('endpoints')?.updateValueAndValidity();
        this.secondFormGroup.get('selectors')?.updateValueAndValidity();
      });
  }

  addEndoint() {
    if (this.endpointsForm.valid) {
      this.endpointsList.push(this.endpointsForm.get('value')!.value!);

      this.endpointsList.sort((a, b) => a.localeCompare(b));

      this.secondFormGroup.get('endpoints')?.setValue(this.endpointsList);
      this.endpointsForm.reset({ value: '' });
    }
  }

  addPort() {
    if (this.portForm.valid) {
      const port = parseInt(this.portForm.get('port')!.value!);
      const targetPort = parseInt(this.portForm.get('targetPort')!.value!);
      this.portList.push({
        port: port,
        targetPort: targetPort,
        protocol: this.portForm.get('protocol')!.value!,
      });

      this.portList.sort((a, b) => a.port - b.port);

      this.secondFormGroup.get('ports')?.setValue(this.portList);
      this.portForm.reset({
        port: '',
        targetPort: '',
        protocol: 'TCP',
      });
    }
  }

  updateLabels(value: string[]) {
    this.labelsSelector.set([...value]);
    this.secondFormGroup.get('selectors')?.setValue(this.labelsSelector());
  }

  /**
   * Remove an item by it's index in the list
   */
  removeItemByIndex(index: number, array: unknown[], formControlName: string) {
    transferArrayItem(array, [], index, 0);
    this.secondFormGroup.get(formControlName)?.setValue(array);
  }

  async create() {
    const az = this.firstFormGroup.get('az')?.value;
    if (this.firstFormGroup.valid && this.secondFormGroup.valid && az) {
      const firstValues = this.firstFormGroup.getRawValue();
      const secondValues = this.secondFormGroup.getRawValue();
      const lb = {
        general: {
          productName: firstValues.productName,
        },
        spec: {
          vip: firstValues.vip,
          ports: secondValues.ports,
          selectors: [],
          endpoints: [],
        },
      } as Partial<CreateLoadBalancer>;

      if (secondValues.type === LBTypeEnum.Selector) {
        lb.spec!.selectors = secondValues.selectors;
      } else if (secondValues.type === LBTypeEnum.Endpoint) {
        lb.spec!.endpoints = secondValues.endpoints;
      }

      const createLb = new CreateLoadBalancer(lb);
      const created = await firstValueFrom(
        this.lbService.create(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, az, createLb)
      );
      this.router.navigate(['..', 'details', az, created.eid], { relativeTo: this.route });
    }
  }

  ipInRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const ip = control.value;
      if (!ip) {
        return null;
      }

      const isIPinAnyRange = IsIPinRange(VIRTUAL_IP_RANGE, ip);
      return isIPinAnyRange ? null : { ipRange: true };
    };
  }
}
