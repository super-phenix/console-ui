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
import { CreateSSH } from '@products/00_shared/models/uncategorized/ssh/create-ssh.model';
import { SshService } from '@products/00_shared/services/ssh.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'spx-ssh-create',
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
  templateUrl: './ssh-create.component.html',
  styleUrl: './ssh-create.component.scss',
})
export class SshCreateComponent {
  protected stateSvc = inject(StateService);
  protected sshSvc = inject(SshService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private fb = inject(FormBuilder);
  maxLength = MAX_NAME_LENGTH;

  firstFormGroup = this.fb.nonNullable.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    az: this.fb.nonNullable.control('', Validators.required),
    publicKey: this.fb.nonNullable.control('', Validators.required),
  });

  selectedAz = signal<string | null>(null);


  async create() {
    if (this.firstFormGroup.valid && this.selectedAz()) {
      const createSSH = new CreateSSH({
        general: this.firstFormGroup.getRawValue(),
      });
      await firstValueFrom(
        this.sshSvc.create(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.selectedAz()!, createSSH)
      );
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }
}
