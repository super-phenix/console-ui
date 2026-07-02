import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
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
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { UpdateVPC } from '@products/00_shared/models/network/vpc/create-vpc.model';
import { policyDst, policySrc, StaticRoute } from '@products/00_shared/models/network/vpc/vpc.model';
import { ProductSubnet, ProductVPC } from '@products/00_shared/models/product.model';
import { AZService } from '@products/00_shared/services/az.service';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { VPCService } from '@products/00_shared/services/vpc.service';
import { IsIPinRange } from '@products/00_shared/utils/ip';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { ipValidator, uniqueRoutesValidator } from '@shared/utils/validators';
import { firstValueFrom, forkJoin, Observable, of } from 'rxjs';

@Component({
  selector: 'spx-vpc-update',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatStepperModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    ContentHeaderComponent,
    StepGeneralComponent,
  ],
  templateUrl: './vpc-update.component.html',
  styleUrl: './vpc-update.component.scss',
})
export class VpcUpdateComponent {
  protected stateSvc = inject(StateService);
  protected vpcSvc = inject(VPCService);
  protected subnetSvc = inject(SubnetService);
  protected azSvc = inject(AZService);
  protected permissionSvc = inject(PermissionService);
  protected location = inject(Location);
  private router = inject(Router);

  private readonly dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  maxLength = MAX_NAME_LENGTH;
  readonly MAX_STATIC_ROUTE = 10;

  canProjectSubnetRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSubnetRead));

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
  });

  secondFormGroup = this.fb.array<FormGroup>([], uniqueRoutesValidator());
  manualRoutesCount = signal(0);

  selectedAz = signal<string>('');
  protected eid;

  vpc = signal<ProductVPC | undefined>(undefined);

  subnetsProduct = rxResource({
    params: () => this.vpc()?.vpc?.status.subnets || undefined,
    stream: ({ params }) => {
      // If the user can't read subnets, then don't try to fetch them
      if (!this.canProjectSubnetRead()) {
        return of([]);
      }

      const subnetIds = params || [];
      const obs: Observable<ProductSubnet>[] = [];
      subnetIds.forEach(id => {
        obs.push(
          this.subnetSvc.get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz(), id)
        );
      });
      return forkJoin(obs);
    },
  });

  constructor() {
    const route = inject(ActivatedRoute);
    const permissionSvc = inject(PermissionService);
    const location = inject(Location);

    this.selectedAz.set(route.snapshot.paramMap.get('az') || '');
    this.eid = route.snapshot.paramMap.get('id') || '';
    if (this.selectedAz() && this.eid && permissionSvc.permissions().includes(PermissionsEnum.ProjectVPCWrite)) {
      this.loadVPC();
    } else {
      location.back();
    }
  }

  loadVPC() {
    this.vpcSvc
      .get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz(), this.eid)
      .subscribe(res => {
        this.firstFormGroup.reset({
          az: this.selectedAz(),
          productName: res.productName,
        });

        this.secondFormGroup.clear();
        if (res.vpc?.spec.staticRoutes) {
          const srList = res.vpc.spec.staticRoutes.sort((a, b) => {
            if (a.autoGenerated === b.autoGenerated) {
              return a.routeTable.localeCompare(b.routeTable);
            } else {
              return a.autoGenerated ? -1 : 1;
            }
          });
          srList.forEach(route => {
            this.secondFormGroup.push(
              this.newStaticRoute(
                route.policy,
                route.cidr,
                route.nextHopIP,
                route.routeTable,
                route.autoGenerated || false
              )
            );
          });
        }

        this.vpc.set(res);
      });
  }

  addStaticRoute() {
    if (this.manualRoutesCount() < this.MAX_STATIC_ROUTE) {
      this.secondFormGroup.push(this.newStaticRoute(policySrc, '', '', '', false));
    }
  }

  removeStaticRoute(index: number) {
    this.secondFormGroup.removeAt(index);
  }

  private newStaticRoute(
    policy: typeof policySrc | typeof policyDst,
    cidr: string,
    nextHopIP: string,
    routeTable: string,
    autoGenerated: boolean
  ) {
    if (!autoGenerated) {
      this.manualRoutesCount.update(v => v + 1);
    }

    return this.fb.nonNullable.group({
      policy: this.fb.nonNullable.control(policy, Validators.required),
      cidr: this.fb.nonNullable.control(cidr, Validators.required),
      nextHopIP: this.fb.nonNullable.control(nextHopIP, [
        Validators.required,
        ipValidator(),
        this.ipInRangeValidator(),
      ]),
      routeTable: this.fb.nonNullable.control(routeTable, Validators.required),
      autoGenerated: this.fb.nonNullable.control(autoGenerated),
    });
  }

  async update() {
    if (this.firstFormGroup.valid && this.secondFormGroup.valid && this.selectedAz()) {
      const name = this.vpc()?.productName || this.vpc()?.eid;
      const ref = this.dialog.open(ConfirmDialog, {
        data: {
          title: `Update VPC`,
          content: `Are you sure you want to update "${name}" ?`,
        },
      });
      ref.afterClosed().subscribe(async res => {
        if (!res) {
          return;
        }
        const formValues = this.firstFormGroup.getRawValue();
        const srList = this.secondFormGroup.getRawValue().map<StaticRoute>(v => {
          const sr = v as StaticRoute;
          return {
            policy: sr.policy,
            cidr: sr.cidr,
            nextHopIP: sr.nextHopIP,
            routeTable: sr.routeTable,
          };
        });
        const updateVPC: UpdateVPC = {
          general: {
            productName: formValues.productName,
          },
          staticRoutes: srList,
        };

        await firstValueFrom(
          this.vpcSvc.update(
            this.stateSvc.organization()!.id,
            this.stateSvc.project()!.id,
            this.selectedAz(),
            this.eid,
            updateVPC
          )
        );
        this.router.navigate(['/products', 'network', 'vpc', 'details', this.selectedAz(), this.eid]);
      });
    }
  }

  ipInRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const nextHop = control.value;
      if (!nextHop) {
        return null;
      }

      const subnets = this.subnetsProduct.hasValue() ? this.subnetsProduct.value() : [];
      if (subnets.length > 0) {
        const isIPinAnyRange = subnets.some(sub => {
          if (sub && sub.subnet?.spec.cidrBlock) {
            return IsIPinRange(sub.subnet?.spec.cidrBlock, nextHop);
          } else {
            return false;
          }
        });
        return isIPinAnyRange ? null : { ipRange: true };
      }
      return null;
    };
  }
}
