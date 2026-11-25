import { Location } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { StateService } from '@shared/services/state.service';
import { buildBreadcrumbs } from './breadcrumb';

@Component({
  selector: 'spx-content-header',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './content-header.component.html',
  styleUrl: './content-header.component.scss',
})
export class ContentHeaderComponent {
  protected stateSvc = inject(StateService);
  protected location = inject(Location);
  private router = inject(Router);

  title = input<string>();
  subtitle = input<string>();
  navBack = input();
  titleOnly = input();
  /** Name of the resource being viewed or edited. The breadcrumb falls back to its id. */
  resourceName = input<string | null | undefined>();
  resourceId = input<string | null | undefined>();

  protected crumbs = computed(() =>
    buildBreadcrumbs(this.router.url, this.title(), {
      name: this.resourceName(),
      id: this.resourceId(),
    }),
  );

  navigateBack() {
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
}
