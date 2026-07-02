import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { environment, HelpLink } from '@env/environment';
import { ProductList, ProductUncategorized } from '@shared/models/data/product.enum';
import { ScreenService } from '@shared/services/screen.service';

@Component({
  selector: 'spx-sidenav',
  imports: [
    MatExpansionModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatButtonModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  protected screenSvc = inject(ScreenService);

  readonly ProductList = ProductList;
  readonly ProductUncategorized = ProductUncategorized;
  readonly helpLinks: HelpLink[] = environment.helpLinks ?? [];
}
