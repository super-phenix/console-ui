import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { SshService } from '@products/00_shared/services/ssh.service';

export interface SshUsageDialogData {
  orgaId: string;
  projectId: string;
  az: string;
  eid: string;
  name: string;
}

// 800px fits the EID column, the name and the actions (Material default: 560px)
export const SSH_USAGE_DIALOG_CONFIG = { width: '800px', maxWidth: '92vw', autoFocus: false };

@Component({
  selector: 'spx-ssh-usage-dialog',
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // An EID is always 40 characters: the column fits one and is the same width in the header and the rows
  styles: `
    .mat-column-eid {
      flex: 0 0 400px;
      white-space: nowrap;
    }
  `,
  template: `
    <h2 mat-dialog-title>Usage of {{ data.name }}</h2>
    <div mat-dialog-content>
      @if (usage.isLoading()) {
        <mat-spinner diameter="40" aria-label="Loading usage"></mat-spinner>
      } @else if (usage.error()) {
        <p>Failed to retrieve the usage of this SSH key.</p>
      } @else if (!usage.value()?.length) {
        <p>No instance uses this SSH key.</p>
      } @else {
        <mat-table [dataSource]="usage.value()!">
          <ng-container matColumnDef="eid">
            <mat-header-cell *matHeaderCellDef> ID </mat-header-cell>
            <mat-cell *matCellDef="let el"> {{ el.eid }} </mat-cell>
          </ng-container>

          <ng-container matColumnDef="name">
            <mat-header-cell *matHeaderCellDef> Name </mat-header-cell>
            <mat-cell *matCellDef="let el"> {{ el.productName || '-' }} </mat-cell>
          </ng-container>

          <ng-container matColumnDef="actions">
            <mat-header-cell *matHeaderCellDef></mat-header-cell>
            <mat-cell *matCellDef="let el">
              <a
                matIconButton
                [routerLink]="['/products', 'compute', 'instance', 'details', data.az, el.eid]"
                [attr.aria-label]="'See details of VM ' + (el.productName || el.eid)"
                target="_blank">
                <mat-icon>open_in_new</mat-icon>
              </a>
            </mat-cell>
          </ng-container>

          <mat-header-row *matHeaderRowDef="columns"></mat-header-row>
          <mat-row *matRowDef="let row; columns: columns"></mat-row>
        </mat-table>
      }
    </div>
    <div mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Close</button>
    </div>
  `,
})
export class SshUsageDialog {
  protected readonly data = inject<SshUsageDialogData>(MAT_DIALOG_DATA);
  private readonly sshSvc = inject(SshService);

  protected readonly columns = ['eid', 'name', 'actions'];

  protected readonly usage = rxResource({
    stream: () => this.sshSvc.getUsage(this.data.orgaId, this.data.projectId, this.data.az, this.data.eid),
  });
}
