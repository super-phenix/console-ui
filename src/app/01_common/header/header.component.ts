import { Location, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { AuthService } from '@shared/services/auth.service';
import { OrganizationService } from '@shared/services/organization.service';
import { PermissionService } from '@shared/services/permission.service';
import { ScreenService } from '@shared/services/screen.service';
import { StateService } from '@shared/services/state.service';
import { ContextSelectorComponent } from '../context-selector/context-selector.component';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { LocalStorageService, THEME_KEY } from '@shared/services/local-storage.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'spx-header',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    NgOptimizedImage,
    RouterLink,
    ContextSelectorComponent,
    MatButtonToggleGroup,
    MatButtonToggle,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected auth = inject(AuthService);
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected orgSvc = inject(OrganizationService);
  protected screenSvc = inject(ScreenService);
  protected location = inject(Location);
  protected lss = inject(LocalStorageService);

  isDarkTheme = computed(() => this.lss.getValue(THEME_KEY)() === 'true');

  userIconPath = computed(() => {
    const id = this.auth.user()?.id || '';
    const v = id.replace(/\D/g, '').length;
    return `assets/profile-icons/profile-cat-${v % 6}.svg`;
  });

  showGoBack = signal(true);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Handle route change here
        this.showGoBack.set(
          event.url.includes('create') || event.url.includes('update') || event.url.includes('details')
        );
      }
    });
  }

  logout() {
    this.auth.redirectToFlow('logout');
  }

  navBack() {
    if (this.router.url.includes('update')) {
      this.router.navigateByUrl(this.router.url.replace('update', 'details'));
    } else if (this.router.url.includes('details')) {
      this.router.navigateByUrl(this.router.url.split('/details')[0]);
    } else if (this.router.url.includes('create')) {
      this.router.navigateByUrl(this.router.url.split('/create')[0]);
    } else {
      this.location.back();
    }
  }

  switchTheme() {
    const current = this.isDarkTheme();
    this.lss.setValue(THEME_KEY, !current ? 'true' : 'false');
  }
}
