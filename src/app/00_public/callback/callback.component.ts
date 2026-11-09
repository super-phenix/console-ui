import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { redirectLimit } from '@shared/utils/redirect-limit';

@Component({
  selector: 'spx-callback',
  imports: [],
  template: `<div class="callback">
    @if (limited) {
      <p class="callback__stopped">Sign-in stopped after 10 redirects.</p>
    }
  </div>`,
  styleUrl: './callback.component.scss',
})
export class CallbackComponent {
  protected limited = false;

  constructor() {
    const router = inject(Router);
    const route = inject(ActivatedRoute);

    const returnTo = route.snapshot.queryParamMap.get('return_to') || '/';
    const notActive = route.snapshot.queryParamMap.get('not_active');

    // Ignore `session`. This route is public, so a link could plant another
    // user's access token. The refresh cookie set on this redirect signs the
    // next page in through GET /v1/session.
    if (notActive === 'true') {
      router.navigate(['/', 'inactive-account']);
    } else {
      const safeReturnTo = /^\/(?![/\\])/.test(returnTo) ? returnTo : '/';
      this.limited = !redirectLimit.to(`${document.baseURI.slice(0, -1)}${safeReturnTo}`);
    }
  }
}
