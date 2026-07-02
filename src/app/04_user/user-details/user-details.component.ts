import { Clipboard } from '@angular/cdk/clipboard';
import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { DatePipe } from '@angular/common';
import { TabsBase } from '@products/00_shared/components/tabs-base/tab-base.component';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { CreateOrganizationDialog } from '@shared/dialogs/create-organization-dialog.component';
import { CreateApiTokenDialog } from '@shared/dialogs/create-api-token-dialog.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { getUserOrganization } from '@shared/models/data/user';
import { AuthService } from '@shared/services/auth.service';
import { OrganizationService } from '@shared/services/organization.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { ApiTokenService, ApiToken } from '@shared/services/api-token.service';
import { UserService } from '@shared/services/user.service';
import { firstValueFrom } from 'rxjs';
import { BannerLevelEnum } from '@shared/models/enums';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { Organization } from '@shared/models/data/organization';
import { MatSortModule, Sort } from '@angular/material/sort';

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

function sortData(this: Sort, a: ApiToken, b: ApiToken) {
  const isAsc = this.direction === 'asc';
  switch (this.active) {
    case 'name':
      return a.name.localeCompare(b.name) * (isAsc ? 1 : -1);
    case 'createdAt':
      return compare(new Date(a.createdAt).getTime(), new Date(b.createdAt).getTime(), isAsc);
    case 'expiresAt':
      return compare(new Date(a.expiresAt).getTime(), new Date(b.expiresAt).getTime(), isAsc);
    default:
      return 0;
  }
}

@Component({
  selector: 'spx-user-details',
  imports: [
    MatButtonModule,
    MatIconModule,
    ContentHeaderComponent,
    MatTabsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    DatePipe,
    BannerComponent,
    SpanCopyComponent,
    MatSortModule,
  ],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss',
})
export class UserDetailsComponent extends TabsBase {
  protected auth = inject(AuthService);
  protected stateSvc = inject(StateService);
  protected orgSvc = inject(OrganizationService);
  protected permissionSvc = inject(PermissionService);
  protected clipboard = inject(Clipboard);
  protected apiTokenSvc = inject(ApiTokenService);
  protected userSvc = inject(UserService);

  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);

  readonly BannerLevelEnum = BannerLevelEnum;

  user;
  displayedColumns: string[] = ['name', 'id', 'actions'];
  tokenDisplayedColumns: string[] = ['name', 'prefix', 'createdAt', 'expiresAt', 'actions'];
  filterValue: WritableSignal<string> = signal('');
  tokenFilterValue: WritableSignal<string> = signal('');
  apiTokens: WritableSignal<ApiToken[]> = signal([]);
  createdToken: WritableSignal<string | null> = signal(null);
  dataSource = computed(() => {
    const user = this.auth.user();
    const orgList = user ? getUserOrganization(user) : [];
    const dataSource = new MatTableDataSource(orgList);
    // Override filterPredicate to use nested object
    dataSource.filterPredicate = (data, filter) => {
      const dataStr = JSON.stringify(data).toLowerCase();
      return dataStr.indexOf(filter) != -1;
    };
    dataSource.filter = this.filterValue();

    return dataSource;
  });

  defaultSort: Sort = {
    active: 'name',
    direction: 'asc',
  };

  currentSort = signal<Sort>(this.defaultSort);
  filteredApiTokens = computed(() => {
    const tokens = this.apiTokens();
    const filter = this.tokenFilterValue();
    const sort = this.currentSort();

    let result = [];
    if (!filter) {
      result = tokens;
    } else {
      result = tokens.filter(token => {
        return (
          token.name.toLowerCase().includes(filter) ||
          token.prefix.toLowerCase().includes(filter) ||
          token.id.toLowerCase().includes(filter)
        );
      });
    }
    return [...result.sort(sortData.bind(sort))];
  });

  constructor() {
    super();
    this.user = this.auth.user.asReadonly();
    this.loadTokens();
  }

  loadTokens() {
    this.apiTokenSvc.list().subscribe(tokens => {
      this.apiTokens.set(tokens || []);
    });
  }

  updateFilter(value: string) {
    this.filterValue.set(value.trim().toLowerCase());
  }

  updateTokenFilter(value: string) {
    this.tokenFilterValue.set(value.trim().toLowerCase());
  }

  settings() {
    this.auth.redirectToFlow('settings');
  }

  copy(value: string) {
    if (this.user()) {
      this.clipboard.copy(value);
      this.snackbar.open('Copied to clipboard!', undefined, {
        horizontalPosition: 'end',
        duration: 3000,
      });
    }
  }

  openOrgSettings(el: Organization) {
    if (el.id) {
      this.stateSvc.setOrganization(el.id);
      this.router.navigate(['/organization/settings']);
    }
  }

  createOrg() {
    const dialogRef = this.dialog.open(CreateOrganizationDialog);
    dialogRef.afterClosed().subscribe(async res => {
      if (res) {
        await firstValueFrom(this.orgSvc.createOrganization(res));
        this.auth.reloadUser();
      }
    });
  }

  createToken() {
    const dialogRef = this.dialog.open(CreateApiTokenDialog);
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const body = {
          name: res.name,
          expiresAt: res.expiresAt ? res.expiresAt.toISOString() : undefined,
        };
        this.apiTokenSvc.create(body).subscribe(response => {
          this.createdToken.set(response.token);
          this.loadTokens();
        });
      }
    });
  }

  deleteToken(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Delete API Token',
        content: 'Are you sure you want to delete this API token?',
        confirmBtn: 'Delete',
        cancelBtn: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.apiTokenSvc.revoke(id).subscribe(() => {
          this.snackbar.open('API Token deleted successfully!', undefined, {
            duration: 3000,
          });
          this.loadTokens();
        });
      }
    });
  }

  resetInviteCode() {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Reset Invite Code',
        content: 'Are you sure you want to reset your invite code? The current code will no longer be valid.',
        confirmBtn: 'Regenerate',
        cancelBtn: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.userSvc.resetInviteCode().subscribe(() => {
          this.auth.reloadUser();
          this.snackbar.open('Invite code reset successfully!', undefined, {
            horizontalPosition: 'end',
            duration: 3000,
          });
        });
      }
    });
  }

  trackBy(_: number, token: ApiToken) {
    return token.id;
  }
}
