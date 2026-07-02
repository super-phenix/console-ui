import { Location } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { UpdateSubnet } from '@products/00_shared/models/network/subnet/create-subnet.model';
import { ProtocolEnum } from '@products/00_shared/models/network/subnet/protocol.enum';
import { ProductSubnet } from '@products/00_shared/models/product.model';
import { AZService } from '@products/00_shared/services/az.service';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom, map, of } from 'rxjs';

@Component({
  selector: 'spx-subnet-update',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatStepperModule,
    MatSlideToggleModule,
    ContentHeaderComponent,
    StepGeneralComponent,
  ],
  templateUrl: './subnet-update.component.html',
  styleUrl: './subnet-update.component.scss',
})
export class SubnetUpdateComponent {
  protected stateSvc = inject(StateService);
  protected subnetSvc = inject(SubnetService);
  protected azSvc = inject(AZService);
  protected location = inject(Location);
  private router = inject(Router);

  private readonly dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  ProtocolEnum = ProtocolEnum;
  maxLength = MAX_NAME_LENGTH;

  protected az;
  protected eid;

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),

    private: this.fb.nonNullable.control(false),
    natGateway: this.fb.nonNullable.control(false),
  });

  secondFormGroup = this.fb.nonNullable.group({
    dnsV4: this.fb.control<string | null>(null),
    dnsV6: this.fb.control<string | null>(null),
  });

  subnet = signal<ProductSubnet | undefined>(undefined);

  subnetHasEIP = rxResource({
    params: () => this.subnet(),
    stream: ({ params }) => {
      if (params) {
        return this.subnetSvc
          .hasEIP(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az, params.eid)
          .pipe(map(res => res.hasEIP));
      } else {
        return of(false);
      }
    },
  });

  constructor() {
    const route = inject(ActivatedRoute);
    const permissionSvc = inject(PermissionService);
    const location = inject(Location);

    this.az = route.snapshot.paramMap.get('az') || '';
    this.eid = route.snapshot.paramMap.get('id') || '';
    if (this.az && this.eid && permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceWrite)) {
      this.loadSubnet();
    } else {
      location.back();
    }

    effect(() => {
      const hasEIP = this.subnetHasEIP.hasValue() ? this.subnetHasEIP.value() : false;
      if (hasEIP) {
        this.firstFormGroup.get(['natGateway', 'enable'])?.disable();
      } else {
        this.firstFormGroup.get(['natGateway', 'enable'])?.enable();
      }
      this.firstFormGroup.get(['natGateway', 'enable'])?.updateValueAndValidity();
    });
  }

  loadSubnet() {
    this.subnetSvc
      .get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az, this.eid)
      .subscribe(res => {
        if (res.subnet) {
          this.firstFormGroup.reset({
            productName: res.productName,
            private: res.subnet.spec.private,
            natGateway: !!res.natGateway,
          });
          this.secondFormGroup.reset({
            dnsV4: res.subnet.spec.dhcpV4Options?.replace('dns_server=', '') || null,
            dnsV6: res.subnet.spec.dhcpV6Options?.replace('dns_server=', '') || null,
          });
        }

        this.subnet.set(res);
      });
  }

  async update() {
    if (this.firstFormGroup.valid && this.secondFormGroup.valid) {
      const ref = this.dialog.open(ConfirmDialog, {
        data: {
          title: `Subnet Update`,
          html: `
            <span>Are you sure you want to update "${this.subnet()!.productName}"?</span>`,
        },
      });
      ref.afterClosed().subscribe(async res => {
        if (!res) {
          return;
        }
        const firstValues = this.firstFormGroup.value;
        const secondValues = this.secondFormGroup.value;

        const body: UpdateSubnet = {
          general: {
            productName: firstValues.productName!,
          },
          network: {
            private: firstValues.private!,
            dnsV4: secondValues.dnsV4 || null,
            dnsV6: secondValues.dnsV6 || null,
          },
          natGateway: {
            enable: firstValues.natGateway || false,
          },
        };
        await firstValueFrom(
          this.subnetSvc.update(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az, this.eid, body)
        );
        this.router.navigate(['/products', 'network', 'subnet', 'details', this.az, this.eid]);
      });
    }
  }
}
