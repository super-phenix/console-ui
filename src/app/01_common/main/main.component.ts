import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ScreenService } from '@shared/services/screen.service';
import { ContextSelectorComponent } from '../context-selector/context-selector.component';
import { HeaderComponent } from '../header/header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';

@Component({
  selector: 'spx-main',
  imports: [
    RouterOutlet,
    HeaderComponent,
    MatSidenavModule,
    SidenavComponent,
    MatButtonModule,
    MatIconModule,
    ContextSelectorComponent,
    RouterLink,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  protected router = inject(Router);
  protected screenSvc = inject(ScreenService);
}
