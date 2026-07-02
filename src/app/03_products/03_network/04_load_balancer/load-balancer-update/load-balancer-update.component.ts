import { transferArrayItem } from '@angular/cdk/drag-drop';
import { Location } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
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
import { ProductLoadBalancer } from '@products/00_shared/models/product.model';
import { LoadBalancerService } from '@products/00_shared/services/load-balancer.service';
import { IsIPinRange } from '@products/00_shared/utils/ip';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import {
  LABEL_KEY_MAX_LENGTH,
  LABEL_KEY_PATTERN,
  LABEL_VALUE_MAX_LENGTH,
  LABEL_VALUE_PATTERN,
  MAX_NAME_LENGTH,
  VIRTUAL_IP_RANGE,
} from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { ipValidator, ipv4Validator } from '@shared/utils/validators';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'spx-load-balancer-update',
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
  templateUrl: './load-balancer-update.component.html',
  styleUrl: './load-balancer-update.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadBalancerUpdateComponent {
  private fb = inject(FormBuilder);
  protected lbService = inject(LoadBalancerService);
  protected stateSvc = inject(StateService);
  protected location = inject(Location);
  private readonly dialog = inject(MatDialog);
  private router = inject(Router);

  protected az;
  protected eid;
  lb = signal<ProductLoadBalancer | undefined>(undefined);

  LBTypeEnum = LBTypeEnum;
  readonly VIRTUAL_IP_RANGE = VIRTUAL_IP_RANGE;

  maxLength = MAX_NAME_LENGTH;

  labelValueMaxLength = LABEL_VALUE_MAX_LENGTH;
  labelValuePattern = LABEL_VALUE_PATTERN;
  labelKeyMaxLength = LABEL_KEY_MAX_LENGTH;
  labelKeyPattern = LABEL_KEY_PATTERN;

  firstFormGroup = this.fb.group({
    productName: this.fb.nonNullable.control('', Validators.required),
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

  selectorsList = signal<string[]>([]);

  get generalForm(): FormGroup {
    return this.firstFormGroup;
  }

  get specForm(): FormGroup {
    return this.secondFormGroup;
  }

  constructor() {
    const route = inject(ActivatedRoute);
    const permissionSvc = inject(PermissionService);

    this.az = route.snapshot.paramMap.get('az') || '';
    this.eid = route.snapshot.paramMap.get('id') || '';
    if (this.az && this.eid && permissionSvc.permissions().includes(PermissionsEnum.ProjectLoadBalancerWrite)) {
      this.loadLB();
    } else {
      this.location.back();
    }

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

  loadLB() {
    this.lbService
      .get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az, this.eid)
      .subscribe(res => {
        if (res.loadBalancer) {
          this.firstFormGroup.reset({ productName: res.productName });
        }

        this.firstFormGroup.get('vip')?.setValue(res.loadBalancer?.spec.vip ?? '');

        //  Load either Selectors or Endpoints
        if (res.loadBalancer?.spec?.selector && res.loadBalancer?.spec?.selector?.length > 0) {
          const selectorsList: string[] = [...res.loadBalancer.spec.selector];
          selectorsList.sort((a, b) => a.localeCompare(b));
          this.selectorsList.set(selectorsList);
          this.secondFormGroup.get('selectors')?.setValue(this.selectorsList());
          this.secondFormGroup.get('type')?.setValue(LBTypeEnum.Selector);
        } else if (res.loadBalancer?.spec?.endpoints && res.loadBalancer?.spec?.endpoints?.length > 0) {
          this.endpointsList = res.loadBalancer?.spec?.endpoints;
          this.endpointsList.sort((a, b) => a.localeCompare(b));
          this.secondFormGroup.get('endpoints')?.setValue(this.endpointsList);
          this.secondFormGroup.get('type')?.setValue(LBTypeEnum.Endpoint);
        }

        if (res.loadBalancer?.spec.ports && res.loadBalancer.spec.ports.length > 0) {
          const portsList: RulePort[] = [];
          res.loadBalancer.spec.ports.forEach(v => {
            portsList.push({
              port: v.port,
              targetPort: v.targetPort,
              protocol: v.protocol as 'UDP' | 'TCP',
            });
          });

          this.portList = portsList;
          this.portList.sort((a, b) => a.port - b.port);
          this.secondFormGroup.get('ports')?.setValue(this.portList);
        }

        this.lb.set(res);
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
    this.selectorsList.set([...value]);
    this.secondFormGroup.get('selectors')?.setValue(this.selectorsList());
  }

  /**
   * Remove an item by it's index in the list
   */
  removeItemByIndex(index: number, array: unknown[], formControlName: string) {
    transferArrayItem(array, [], index, 0);
    this.secondFormGroup.get(formControlName)?.setValue(array);
  }

  async update() {
    if (this.firstFormGroup.valid && this.secondFormGroup.valid) {
      const ref = this.dialog.open(ConfirmDialog, {
        data: {
          title: `Load Balancer Update`,
          html: `
                  <span>Are you sure you want to update "${this.lb()!.productName}"?</span>`,
        },
      });
      ref.afterClosed().subscribe(async res => {
        if (!res) {
          return;
        }
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

        const updateLb = new CreateLoadBalancer(lb);
        await firstValueFrom(
          this.lbService.update(
            this.stateSvc.organization()!.id,
            this.stateSvc.project()!.id,
            this.az,
            this.eid,
            updateLb
          )
        );
        this.router.navigate(['/products', 'network', 'load-balancer', 'details', this.az, this.eid]);
      });
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
