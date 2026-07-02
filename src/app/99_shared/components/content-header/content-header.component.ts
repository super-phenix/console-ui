import { Location } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { StateService } from '@shared/services/state.service';

@Component({
  selector: 'spx-content-header',
  imports: [MatButtonModule, MatIconModule],
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
