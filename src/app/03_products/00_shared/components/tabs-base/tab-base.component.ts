import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * This abstract component provides a base for tabs usage.
 *
 * @class TabsBase
 */
@Component({
  imports: [MatTabsModule],
  template: '',
})
export abstract class TabsBase {
  initialIndex;
  protected router = inject(Router);

  constructor() {
    const route = inject(ActivatedRoute);
    this.initialIndex = toSignal(route.fragment);
  }

  updateFragment(index: number) {
    this.router.navigate([], { fragment: index + '' });
  }
}
