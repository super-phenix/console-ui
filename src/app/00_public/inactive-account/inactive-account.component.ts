import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { environment } from '@env/environment';
import { AuthService } from '@shared/services/auth.service';

@Component({
  selector: 'spx-inactive-account',
  imports: [MatButtonModule, RouterLink, NgOptimizedImage],
  templateUrl: './inactive-account.component.html',
  styleUrl: './inactive-account.component.scss',
})
export class InactiveAccountComponent {
  protected auth = inject(AuthService);

  protected readonly supportEmail = environment.supportEmail;

  logout() {
    this.auth.redirectToFlow('logout');
  }
}
