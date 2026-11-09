import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'spx-callback',
  imports: [],
  template: '<div class="callback"></div>',
  styleUrl: './callback.component.scss',
})
export class CallbackComponent {
  constructor() {
    const router = inject(Router);
    const route = inject(ActivatedRoute);

    const returnTo = route.snapshot.queryParamMap.get('return_to') || '/';

    const notActive = route.snapshot.queryParamMap.get('not_active');

    if (notActive === 'true') {
      router.navigate(['/', 'inactive-account']);
    } else {
      window.location.href = `${document.baseURI.slice(0, -1)}${returnTo}`;
    }
  }
}
