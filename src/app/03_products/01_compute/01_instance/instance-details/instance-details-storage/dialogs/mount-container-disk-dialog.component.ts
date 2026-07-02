import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ContainerDiskCardComponent } from '@products/00_shared/components/container-disk-card/container-disk-card.component';
import { ContainerDisk } from '@products/00_shared/models/compute/instance/container-disk';

interface ManageContainerDisksDialogData {
  disks: ContainerDisk[];
  mountedTypes: string[];
}

type DiskFilter = 'all' | 'mounted' | 'unmounted';

@Component({
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    ContainerDiskCardComponent,
  ],
  template: `
    <h2 mat-dialog-title>Manage container disks</h2>
    <div mat-dialog-content class="dialog">
      <p class="dialog__description">
        A <strong>container disk</strong> is a read-only disk image provided by the platform (e.g. Windows VirtIO
        drivers, cloud-init ISOs). It is attached to the instance as a CD-ROM and does not consume project storage.
      </p>
      <p class="dialog__hint">
        <i>Check disks to mount them, uncheck currently-mounted ones to unmount. Changes apply after the next restart.</i>
      </p>

      @if (data.disks.length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-state__icon">album</mat-icon>
          <div class="empty-state__title">No container disks available</div>
          <div class="empty-state__subtitle">There are no container disks for this instance's OS preference.</div>
        </div>
      } @else {
        <mat-button-toggle-group
          class="dialog__filter"
          [value]="filter()"
          (change)="filter.set($event.value)"
          aria-label="Filter disks">
          <mat-button-toggle value="all">All ({{ data.disks.length }})</mat-button-toggle>
          <mat-button-toggle value="mounted">Mounted ({{ mountedCount }})</mat-button-toggle>
          <mat-button-toggle value="unmounted">Not mounted ({{ unmountedCount }})</mat-button-toggle>
        </mat-button-toggle-group>

        @if (visibleDisks().length === 0) {
          <div class="empty-state empty-state--inline">
            <mat-icon class="empty-state__icon empty-state__icon--small">filter_alt_off</mat-icon>
            <div class="empty-state__subtitle">No disks match this filter.</div>
          </div>
        } @else {
          <div class="disk-list" role="group" aria-label="Container disks">
            @for (cd of visibleDisks(); track cd.id) {
              <spx-container-disk-card
                [disk]="cd"
                [selected]="!!selections()[cd.id]"
                [mounted]="mountedSet.has(cd.id)"
                (toggled)="toggle(cd.id, $event)" />
            }
          </div>
        }
      }
    </div>
    <div mat-dialog-actions>
      <button type="button" matButton="outlined" mat-dialog-close>Cancel</button>
      <button
        type="button"
        matButton="filled"
        color="primary"
        [disabled]="!hasChanges()"
        (click)="confirm()">
        Apply
      </button>
    </div>
  `,
  styles: `
    .dialog {
      min-width: 480px;
      max-width: 600px;
    }

    .dialog__description,
    .dialog__hint {
      margin: 0 0 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .dialog__filter {
      margin: 0.25rem 0 0.75rem;
    }

    .disk-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.25rem;
      padding: 2rem 1rem;
      background: var(--mat-sys-surface);
      border: 1px dashed var(--stroke-default);
      border-radius: var(--br-medium);
      color: var(--mat-sys-on-surface-variant);
    }

    .empty-state--inline {
      padding: 1.25rem 1rem;
    }

    .empty-state__icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      opacity: 0.7;
    }

    .empty-state__icon--small {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .empty-state__title {
      font-weight: 500;
      color: var(--mat-sys-on-surface);
      margin-top: 0.25rem;
    }

    .empty-state__subtitle {
      font-size: 0.85rem;
    }
  `,
})
export class ManageContainerDisksDialog {
  readonly dialogRef = inject(MatDialogRef<ManageContainerDisksDialog, string[]>);
  readonly data = inject<ManageContainerDisksDialogData>(MAT_DIALOG_DATA);

  readonly mountedSet: ReadonlySet<string> = new Set(this.data.mountedTypes);
  readonly mountedCount = this.data.disks.filter(d => this.mountedSet.has(d.id)).length;
  readonly unmountedCount = this.data.disks.length - this.mountedCount;

  filter = signal<DiskFilter>('all');

  selections = signal<Record<string, boolean>>(
    Object.fromEntries(this.data.mountedTypes.map(t => [t, true]))
  );

  selectedTypes = computed(() =>
    Object.entries(this.selections())
      .filter(([, v]) => v)
      .map(([k]) => k)
  );

  hasChanges = computed(() => {
    const selected = new Set(this.selectedTypes());
    if (selected.size !== this.mountedSet.size) return true;
    for (const t of selected) {
      if (!this.mountedSet.has(t)) return true;
    }
    return false;
  });

  visibleDisks = computed(() => {
    const f = this.filter();
    if (f === 'all') return this.data.disks;
    if (f === 'mounted') return this.data.disks.filter(d => this.mountedSet.has(d.id));
    return this.data.disks.filter(d => !this.mountedSet.has(d.id));
  });

  toggle(type: string, checked: boolean) {
    this.selections.update(s => ({ ...s, [type]: checked }));
  }

  confirm() {
    this.dialogRef.close(this.selectedTypes());
  }
}
