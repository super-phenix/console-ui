import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ContainerDisk } from '@products/00_shared/models/compute/instance/container-disk';

@Component({
  selector: 'spx-container-disk-card',
  imports: [MatIconModule],
  template: `
    <button
      type="button"
      class="disk-tile"
      [class.disk-tile--selected]="selected()"
      [attr.aria-pressed]="selected()"
      (click)="toggled.emit(!selected())">
      <span class="disk-tile__icon">
        <mat-icon>album</mat-icon>
      </span>
      <span class="disk-tile__body">
        <span class="disk-tile__title-row">
          <span class="disk-tile__title">{{ disk().displayName }}</span>
          @if (mounted()) {
            <span class="disk-tile__badge disk-tile__badge--mounted">Mounted</span>
          }
          @if (disk().recommended) {
            <span class="disk-tile__badge">Recommended</span>
          }
        </span>
        <span class="disk-tile__subtitle">
          <span class="disk-tile__bus">{{ disk().bus }}</span>
          @if (disk().supportedOS.length > 0) {
            <span class="disk-tile__sep">·</span>
            <span class="disk-tile__os">{{ disk().supportedOS.join(', ') }}</span>
          }
        </span>
      </span>
      <mat-icon class="disk-tile__indicator">
        {{ selected() ? 'check_circle' : 'radio_button_unchecked' }}
      </mat-icon>
    </button>
  `,
  styles: `
    .disk-tile {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      width: 100%;
      padding: 0.75rem 0.875rem;
      background: var(--mat-sys-surface);
      border: 1px solid var(--stroke-default);
      border-radius: var(--br-medium);
      cursor: pointer;
      text-align: left;
      font: inherit;
      color: inherit;
      transition:
        border-color 120ms ease,
        background-color 120ms ease,
        box-shadow 120ms ease;
    }

    .disk-tile:hover {
      background: var(--mat-sys-surface-container);
    }

    .disk-tile:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }

    .disk-tile--selected {
      border-color: var(--mat-sys-primary);
      background: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
    }

    .disk-tile__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: 10px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .disk-tile--selected .disk-tile__icon {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }

    .disk-tile__body {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      flex: 1 1 auto;
      min-width: 0;
    }

    .disk-tile__title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .disk-tile__title {
      font-weight: 500;
      line-height: 1.2;
    }

    .disk-tile__badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 0.7rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      border-radius: 999px;
      background: var(--mat-sys-secondary-container, var(--mat-sys-primary-container));
      color: var(--mat-sys-on-secondary-container, var(--mat-sys-on-primary-container));
    }

    .disk-tile__badge--mounted {
      background: var(--custom-chips-success);
      color: var(--custom-chips-on-success);
    }

    .disk-tile__subtitle {
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
      display: inline-flex;
      gap: 0.375rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .disk-tile__bus {
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .disk-tile__sep {
      opacity: 0.6;
    }

    .disk-tile__indicator {
      flex-shrink: 0;
      color: var(--mat-sys-outline);
      transition: color 120ms ease;
    }

    .disk-tile--selected .disk-tile__indicator {
      color: var(--mat-sys-primary);
    }
  `,
})
export class ContainerDiskCardComponent {
  readonly disk = input.required<ContainerDisk>();
  readonly selected = input.required<boolean>();
  readonly mounted = input<boolean>(false);
  readonly toggled = output<boolean>();
}
