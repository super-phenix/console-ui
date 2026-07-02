import { Component, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { StepGeneralComponent } from '@products/00_shared/components/forms-step/step-general/step-general.component';
import { CreateVPC } from '@products/00_shared/models/network/vpc/create-vpc.model';
import { VPCService } from '@products/00_shared/services/vpc.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'spx-vpc-create',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatStepperModule,
    ContentHeaderComponent,
    StepGeneralComponent,
  ],
  templateUrl: './vpc-create.component.html',
  styleUrl: './vpc-create.component.scss',
})
export class VpcCreateComponent {
  protected stateSvc = inject(StateService);
  protected vpcSvc = inject(VPCService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private fb = inject(FormBuilder);
  maxLength = MAX_NAME_LENGTH;

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
  });

  selectedAz = signal<string | null>(null);


  async create() {
    if (this.firstFormGroup.valid && this.selectedAz()) {
      const createVPC: CreateVPC = {
        general: {
          productName: this.firstFormGroup.value.productName!,
        },
      };
      const created = await firstValueFrom(
        this.vpcSvc.create(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz()!, createVPC)
      );
      this.router.navigate(['..', 'details', this.selectedAz(), created.eid], { relativeTo: this.route });
    }
  }
}
