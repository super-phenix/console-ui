import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'spx-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  matIconRegistry = inject(MatIconRegistry);

  constructor() {
    const matIconRegistry = this.matIconRegistry;

    matIconRegistry.registerFontClassAlias('symbols-fill', 'material-symbols-rounded symbols-fill');
    matIconRegistry.setDefaultFontSetClass('material-symbols-rounded');
  }
}
