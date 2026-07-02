import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { ScreenService } from '@shared/services/screen.service';
import { StateService } from '@shared/services/state.service';
import { ChangelogComponent } from '../changelog/changelog.component';
import { LocalStorageService, THEME_KEY } from '@shared/services/local-storage.service';
import { GridDirective } from '@shared/directives/grid.directive';

@Component({
  selector: 'spx-dashboard',
  imports: [
    MatButtonModule,
    MatIconModule,
    NgOptimizedImage,
    ContentHeaderComponent,
    MatCardModule,
    ChangelogComponent,
    GridDirective,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  protected stateSvc = inject(StateService);
  protected screenSvc = inject(ScreenService);
  protected lss = inject(LocalStorageService);

  isDarkTheme = computed(() => this.lss.getValue(THEME_KEY)() === 'true');
}
