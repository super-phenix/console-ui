import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { environment } from '@env/environment';
import { AuthService } from '@shared/services/auth.service';

@Component({
  selector: 'spx-inactive-account',
  imports: [MatButtonModule, RouterLink],
  templateUrl: './inactive-account.component.html',
  styleUrls: [
    '../../98_kratos-pages/shared/components/base-flow/base-flow.component.scss',
    './inactive-account.component.scss',
  ],
})
export class InactiveAccountComponent {
  protected auth = inject(AuthService);

  protected readonly supportEmail = environment.supportEmail;

  logout() {
    this.auth.redirectToFlow('logout');
  }
}
