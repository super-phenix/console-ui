import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductListFilterComponent } from '@products/00_shared/components/product-list-filter/product-list-filter.component';
import { ProductSSH } from '@products/00_shared/models/product.model';
import { SshService } from '@products/00_shared/services/ssh.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { SSH_REFRESH_KEY, LocalStorageService } from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { catchError, firstValueFrom, of } from 'rxjs';
import { ProductTableWrapperComponent } from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';
import { DEFAULT_REFRESH_INTERVAL } from '@shared/models/consts';

interface ProductSSHItem {
  data: ProductSSH;
  isPRA: boolean;
}

@Component({
  selector: 'spx-ssh-list',
  imports: [
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatChipsModule,
    MatMenuModule,
    DatePipe,
    ContentHeaderComponent,
    ProductListFilterComponent,
    ProductTableWrapperComponent,
  ],
  templateUrl: './ssh-list.component.html',
  styleUrl: './ssh-list.component.scss',
})
export class SshListComponent {
  protected readonly userLang = navigator.language;

  protected stateSvc = inject(StateService);
  protected sshSvc = inject(SshService);
  protected permissionSvc = inject(PermissionService);
  protected route = inject(ActivatedRoute);
  protected lss = inject(LocalStorageService);

  private readonly dialog = inject(MatDialog);

  readonly SSH_REFRESH_KEY = SSH_REFRESH_KEY;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(SSH_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  canProjectSSHWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSSHWrite));

  displayedColumns: string[] = ['az', 'name', 'date', 'gitops', 'actions'];

  sshProduct;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());
  dataSource = computed(() => {
    const rawDatas = this.sshProduct.value() != null ? this.sshProduct.value()! : [];
    const datas: ProductSSHItem[] = rawDatas.map(d => ({ data: d, isPRA: false }));
    const dataSource = new MatTableDataSource(datas);
    // Override filterPredicate to use nested object
    dataSource.filterPredicate = this.filterPredicate;
    dataSource.filter = JSON.stringify(this.filterValue(), mapHandlerReplacer);

    return dataSource;
  });


  private needReload = signal(0);

  constructor() {
    const stateSvc = this.stateSvc;
    const sshSvc = this.sshSvc;

    this.sshProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          return sshSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id).pipe(
            catchError(() => {
              return of([]);
            })
          );
        } else {
          return of([]);
        }
      },
    });
  }

  updateFilter(key: string, value: string) {
    this.filterValue.update(prev => new Map(prev).set(key, value));
  }

  deleteSSH(sshKey: ProductSSH) {
    if (sshKey.codeAZ) {
      const name = sshKey.productName ? sshKey.productName : sshKey.eid;
      const ref = this.dialog.open(ConfirmDialog, {
        data: {
          title: `Delete ${name}`,
          content: `Do you want to permanently delete "${name}"?`,
        },
      });
      ref.afterClosed().subscribe(res => {
        if (res == true) {
          firstValueFrom(
            this.sshSvc.delete(
              this.stateSvc.organization()!.id,
              this.stateSvc.project()!.id,
              sshKey.codeAZ!,
              sshKey.eid!
            )
          ).then(() => this.reloadData());
        }
      });
    }
  }

  private filterPredicate(item: ProductSSHItem, filter: string) {
    const filterMap = JSON.parse(filter, mapHandlerReviver);
    // If we have a az filter and it doesn't match
    if (filterMap.get('az') && item.data.codeAZ !== filterMap.get('az')) {
      return false;
    }

    // If we have a text filter
    if (filterMap.get('search')) {
      return (
        item.data.productName.toLowerCase().includes(filterMap.get('search')) ||
        item.data.eid.toLowerCase().includes(filterMap.get('search'))
      );
    } else {
      return true;
    }
  }

  reloadData() {
    this.needReload.update(v => v + 1);
  }
}
