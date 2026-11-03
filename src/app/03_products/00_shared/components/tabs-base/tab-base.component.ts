import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Index of the tab to select from the URL fragment: the index itself, or the name of the tab among
 * `tabNames` (the displayed tabs, in order). The first tab when the named tab is not displayed.
 */
export function tabIndexFromFragment(
  fragment: string | null | undefined,
  tabNames: string[]
): string | number | null | undefined {
  if (fragment && isNaN(Number(fragment))) {
    return Math.max(tabNames.indexOf(fragment), 0);
  }
  return fragment;
}

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
