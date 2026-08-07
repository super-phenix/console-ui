import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { LocalStorageService, THEME_KEY } from '@shared/services/local-storage.service';

@Component({
  selector: 'spx-auth-layout',
  imports: [RouterOutlet, MatButtonToggleGroup, MatButtonToggle, MatIconModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  protected lss = inject(LocalStorageService);

  isDarkTheme = computed(() => this.lss.getValue(THEME_KEY)() === 'true');

  switchTheme() {
    const current = this.isDarkTheme();
    this.lss.setValue(THEME_KEY, !current ? 'true' : 'false');
  }
}
