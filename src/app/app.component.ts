import { Component, computed, effect, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { LocalStorageService, THEME_KEY } from '@shared/services/local-storage.service';

@Component({
  selector: 'spx-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  matIconRegistry = inject(MatIconRegistry);

  protected lss = inject(LocalStorageService);

  isDarkTheme = computed(() => this.lss.getValue(THEME_KEY)() === 'true');

  constructor() {
    const matIconRegistry = this.matIconRegistry;

    matIconRegistry.registerFontClassAlias('symbols-fill', 'material-symbols-rounded symbols-fill');
    matIconRegistry.setDefaultFontSetClass('material-symbols-rounded');

    effect(() => {
      document.documentElement.style.colorScheme = this.isDarkTheme() ? 'dark' : 'light';
    });
  }
}
