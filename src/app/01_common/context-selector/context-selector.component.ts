import { afterNextRender, Component, computed, ElementRef, inject, Injector, input, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { Organization } from '@shared/models/data/organization';
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
  private injector = inject(Injector);

  // The account's main personal org (personalOrg[0]) first, then its other personal orgs,
  // then the guest orgs. Natural sort within each group: case-insensitive and numbers
  // compared by value ("org2" before "org10").
  orgList = computed(() => {
    const user = this.auth.user();
    if (!user) return [];
    const mainId = user.personalOrg[0]?.id;
    const personalIds = new Set(user.personalOrg.map(org => org.id));
    const rank = (org: Organization) => (org.id === mainId ? 0 : personalIds.has(org.id) ? 1 : 2);
    return getUserOrganization(user).sort(
      (a, b) =>
        rank(a) - rank(b) || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
    );
  });

  // "default" project first when it exists (it can be deleted), then natural sort.
  projectList = computed(() =>
    [...(this.stateSvc.organization()?.projects ?? [])].sort(
      (a, b) =>
        Number(b.name === 'default') - Number(a.name === 'default') ||
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
    ),
  );

  orgFilter = signal('');

  filteredOrgList = computed(() => {
    const filter = this.orgFilter().trim().toLowerCase();
    return filter ? this.orgList().filter(org => org.name.toLowerCase().includes(filter)) : this.orgList();
  });

  visibleOrgIds = computed(() => new Set(this.filteredOrgList().map(org => org.id)));

  private orgSearchInput = viewChild<ElementRef<HTMLInputElement>>('orgSearchInput');

  background = input<'normal' | 'inverted'>('normal');

  // True once the user moved through the options with the arrow keys.
  private orgNavigated = false;

  orgSelectOpened(opened: boolean) {
    this.orgNavigated = false;
    if (opened) {
      // The panel is attached after openedChange fires: focus once it is rendered.
      afterNextRender(() => this.orgSearchInput()?.nativeElement.focus(), { injector: this.injector });
    } else {
      this.orgFilter.set('');
    }
  }

  // Arrows are handed to mat-select, which highlights the options; Enter then selects the
  // highlighted one, or the first match when the user only typed. Every other key
  // stays in the input instead of triggering mat-select typeahead and selection.
  // The panel lives inside the mat-select host, so a bubbling keydown would be handled
  // twice (arrows would move two options): forward it once and stop it here.
  onOrgSearchKeydown(event: KeyboardEvent, select: MatSelect) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      this.orgNavigated = true;
      event.stopPropagation();
      select._handleKeydown(event);
    } else if (event.key === 'Enter') {
      event.stopPropagation();
      if (this.orgNavigated) {
        select._handleKeydown(event);
        return;
      }
      event.preventDefault();
      const first = this.filteredOrgList()[0];
      if (first) {
        select.close();
        if (first.id !== this.stateSvc.organization()?.id) {
          this.orgChanged(first.id);
        }
      }
    } else if (event.key !== 'Escape' && event.key !== 'Tab') {
      this.orgNavigated = false;
      event.stopPropagation();
    }
  }

  orgChanged(orgId: string) {
    this.stateSvc.setOrganization(orgId);
  }

  projectChanged(projectId: string) {
    this.stateSvc.setProject(projectId);
  }
}
