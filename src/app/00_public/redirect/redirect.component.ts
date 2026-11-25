import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getProduct } from '@shared/models/data/product.enum';
import { AuthService } from '@shared/services/auth.service';
import { StateService } from '@shared/services/state.service';

@Component({
  selector: 'spx-redirect',
  imports: [],
  template: '<div class="redirect"></div>',
  styleUrl: './redirect.component.scss',
})
export class RedirectComponent {
  protected router = inject(Router);
  protected auth = inject(AuthService);
  protected stateSvc = inject(StateService);

  constructor() {
    const route = inject(ActivatedRoute);

    const orgaId = route.snapshot.paramMap.get('orgId') || '';
    const projectId = route.snapshot.paramMap.get('projectId') || '';
    const codeAz = route.snapshot.paramMap.get('az') || '';
    const productType = route.snapshot.paramMap.get('productType') || '';
    const productId = route.snapshot.paramMap.get('productId') || '';

    this.auth
      .getAccessToken()
      .then(() => {
        if (this.auth.userLoggedIn()) {
          this.open(orgaId, projectId, codeAz, productType, productId);
        } else {
          this.auth.redirectToFlow('login');
        }
      })
      .catch(() => {
        this.auth.redirectToFlow('login');
      });
  }

  private async open(orgaId: string, projectId: string, codeAz: string, productType: string, productId: string) {
    let target = 'dashboard';
    if (await this.stateSvc.setOrganization(orgaId)) {
      if (projectId === '') {
        target = 'organization/settings';
      } else {
        this.stateSvc.setProject(projectId);
        const productPath = productId && getProduct(productType);
        if (productPath) {
          target = `products/${productPath}/details/${codeAz}/${productId}`;
        }
      }
    }
    this.router.navigate([target]);
  }
}
