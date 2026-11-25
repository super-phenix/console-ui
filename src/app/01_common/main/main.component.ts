import { Component, computed, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ConfirmData, ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { LocalStorageService, ANNOUNCEMENT_DISMISSED_KEY } from '@shared/services/local-storage.service';
import { NoAccessibleProjectSnackbar } from '@shared/models/snackbar';
import { ScreenService } from '@shared/services/screen.service';
import { StateService } from '@shared/services/state.service';
import { Announcement, environment } from '@env/environment';
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
  private lss = inject(LocalStorageService);
  private dialog = inject(MatDialog);
  private stateSvc = inject(StateService);
  private snackBar = inject(MatSnackBar);

  protected announcement: Announcement | undefined = environment.announcement;

  protected bannerDismissed = computed(() => {
    if (!this.announcement) return true;
    return this.lss.getValue(ANNOUNCEMENT_DISMISSED_KEY)() === this.announcement.text;
  });

  protected showBanner = computed(() => !!this.announcement && !this.bannerDismissed());

  constructor() {
    // `projectGuard` does not run again when the organization is switched from a product page.
    effect(() => {
      if (this.stateSvc.noProject() && this.router.url.startsWith('/products')) {
        this.snackBar.open(
          NoAccessibleProjectSnackbar.message,
          NoAccessibleProjectSnackbar.action,
          NoAccessibleProjectSnackbar.config
        );
        this.router.navigate(['/dashboard']);
      }
    });
  }

  protected closeBanner(): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Dismiss announcement',
        content: 'Are you sure you want to dismiss this announcement? This information will still be available in the dashboard.',
        confirmBtn: 'Dismiss',
        cancelBtn: 'Cancel',
      } as ConfirmData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.announcement) {
        this.lss.setValue(ANNOUNCEMENT_DISMISSED_KEY, this.announcement.text);
      }
    });
  }
}
