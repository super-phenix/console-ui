import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { CreateDnat, UpdateEIP } from '@products/00_shared/models/network/eip/create-eip.model';
import { ProductEIP } from '@products/00_shared/models/product.model';
import { EipService } from '@products/00_shared/services/eip.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';
import { EipSecondStepComponent } from '../eip-second-step/eip-second-step.component';
import { ipValidator } from '@shared/utils/validators';

@Component({
  selector: 'spx-eip-update',
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
    EipSecondStepComponent,
  ],
  templateUrl: './eip-update.component.html',
  styleUrl: './eip-update.component.scss',
})
export class EipUpdateComponent {
  protected stateSvc = inject(StateService);
  protected eipSvc = inject(EipService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected location = inject(Location);
  private readonly dialog = inject(MatDialog);

  private fb = inject(FormBuilder);
  maxLength = MAX_NAME_LENGTH;

  selectedAz = signal<string>('');
  protected eid;

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
  });

  secondFormGroup = this.fb.group({
    type: this.fb.nonNullable.control<'ip' | 'cidr'>('ip', [Validators.required]),
    ip: this.fb.nonNullable.control<string>('', [Validators.required, ipValidator()]),
    snat: this.fb.array<string>([]),
    dnat: this.fb.array([]),
  });

  eip = signal<ProductEIP | undefined>(undefined);

  initSnatList = signal<string[]>([]);
  initDnatList = signal<CreateDnat[]>([]);

  constructor() {
    const permissionSvc = inject(PermissionService);

    this.selectedAz.set(this.route.snapshot.paramMap.get('az') || '');
    this.eid = this.route.snapshot.paramMap.get('id') || '';

    if (this.selectedAz() && this.eid && permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceWrite)) {
      this.loadEIP();
    } else {
      this.location.back();
    }
  }

  loadEIP() {
    this.eipSvc
      .get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz(), this.eid)
      .subscribe(res => {
        if (res.eip) {
          this.firstFormGroup.reset({
            productName: res.productName,
            az: this.selectedAz(),
          });
        }

        if (res.fip) {
          this.secondFormGroup.reset({
            type: 'ip',
            ip: res.fip.spec.internalIp,
            snat: [],
            dnat: [],
          });
        } else {
          const dnatList: CreateDnat[] =
            res.dnat?.map(d => {
              const protocol = d.spec.protocol === 'udp' ? 'udp' : 'tcp';
              return {
                externalPort: d.spec.externalPort,
                internalIP: d.spec.internalIp,
                internalPort: d.spec.internalPort,
                protocol: protocol,
              };
            }) || [];
          dnatList.sort((a, b) => parseInt(a.externalPort) - parseInt(b.externalPort));

          const snatList = res.snat?.map(v => v.spec.internalCIDR) || [];

          this.initSnatList.set(snatList);
          this.initDnatList.set(dnatList);

          this.secondFormGroup.reset({
            type: 'cidr',
            ip: '',
            snat: snatList,
            dnat: dnatList,
          });
        }

        this.eip.set(res);
      });
  }

  async update() {
    if (this.firstFormGroup.valid && this.secondFormGroup.valid && this.selectedAz()) {
      const ref = this.dialog.open(ConfirmDialog, {
        data: {
          title: `EIP Update`,
          html: `
              <span>Are you sure you want to update "${this.eip()!.productName}"?</span>`,
        },
      });
      ref.afterClosed().subscribe(async res => {
        if (!res) {
          return;
        }

        let updateEIP: UpdateEIP;
        if (this.secondFormGroup.value?.type === 'ip') {
          updateEIP = {
            general: {
              productName: this.firstFormGroup.value.productName!,
            },
            spec: {
              internalIP: this.secondFormGroup.value?.ip || null,
              snat: null,
              dnat: null,
            },
          };
        } else {
          updateEIP = {
            general: {
              productName: this.firstFormGroup.value.productName!,
            },
            spec: {
              internalIP: null,
              snat: (this.secondFormGroup.value?.snat as string[]) || null,
              dnat: (this.secondFormGroup.value?.dnat as CreateDnat[]) || null,
            },
          };
        }

        await firstValueFrom(
          this.eipSvc.update(
            this.stateSvc.organization()!.id,
            this.stateSvc.project()!.id,
            this.selectedAz(),
            this.eid,
            updateEIP
          )
        );
        this.router.navigate(['/products', 'network', 'eip', 'details', this.selectedAz(), this.eid]);
      });
    }
  }
}
