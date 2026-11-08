import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { writeStoredAccessToken } from '@shared/services/access-token-storage';
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
    const session = route.snapshot.queryParamMap.get('session');
    const notActive = route.snapshot.queryParamMap.get('not_active');

    if (session) {
      writeStoredAccessToken(session);
    }

    if (notActive === 'true') {
      router.navigate(['/', 'inactive-account']);
    } else {
      this.limited = !redirectLimit.to(`${document.baseURI.slice(0, -1)}${returnTo}`);
    }
  }
}
