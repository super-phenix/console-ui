import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '@shared/services/auth.service';
import { OrganizationService } from '@shared/services/organization.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';

@Component({
  selector: 'spx-organization-details',
  imports: [ReactiveFormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatCardModule],
  templateUrl: './organization-details.component.html',
  styleUrl: './organization-details.component.scss',
})
export class OrganizationDetailsComponent {
  protected orgSvc = inject(OrganizationService);
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected auth = inject(AuthService);
}
