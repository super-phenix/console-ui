import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { getUserOrganization } from '@shared/models/data/user';
import { AuthService } from '@shared/services/auth.service';
import { OrganizationService } from '@shared/services/organization.service';
import { StateService } from '@shared/services/state.service';

@Component({
  selector: 'spx-context-selector',
  imports: [MatButtonModule, MatSelectModule, MatFormFieldModule, MatIconModule, MatMenuModule],
  templateUrl: './context-selector.component.html',
  styleUrl: './context-selector.component.scss',
})
export class ContextSelectorComponent {
  protected auth = inject(AuthService);
  protected stateSvc = inject(StateService);
  protected orgSvc = inject(OrganizationService);

  orgList = computed(() => {
    const user = this.auth.user();
    return user ? getUserOrganization(user) : [];
  });

  background = input<'normal' | 'inverted'>('normal');

  orgChanged(orgId: string) {
    this.stateSvc.setOrganization(orgId);
  }

  projectChanged(projectId: string) {
    this.stateSvc.setProject(projectId);
  }
}
