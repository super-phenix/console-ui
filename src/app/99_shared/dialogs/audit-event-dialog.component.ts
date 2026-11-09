import { Clipboard } from '@angular/cdk/clipboard';
import { formatDate } from '@angular/common';
import { Component, inject, LOCALE_ID } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { localTimezoneLabel } from '@products/00_shared/utils/time';
import { AuditEventDisplay, auditStatusChip } from '@shared/models/data/audit-log';
import { AuditEvent } from '@shared/services/audit-log.service';

export interface AuditEventDialogData {
  event: AuditEvent;
  // The caller resolves it from the API event types
  display: AuditEventDisplay;
  // Undefined when the project no longer exists
  projectName?: string;
  // Shows the "All events for this resource" button
  canFilterResource?: boolean;
}

export interface AuditEventDialogResult {
  filterResourceId: string;
}

// 640px fits a product EID on one line (Material default: 560px)
export const AUDIT_EVENT_DIALOG_CONFIG = { width: '640px', maxWidth: '92vw', autoFocus: false };

interface LedgerRow {
  label: string;
  value: string;
  // Monospace, for identifiers and addresses
  mono?: boolean;
  copy?: boolean;
  tooltip?: string;
}

interface LedgerGroup {
  title: string;
  rows: LedgerRow[];
}

@Component({
  selector: 'spx-audit-event-dialog',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  template: `
    <div mat-dialog-title class="audit-event__head">
      <h2 class="audit-event__title">{{ title }}</h2>
      <p class="audit-event__subline">{{ subline }}</p>
    </div>

    <div mat-dialog-content class="audit-event">
      <div [class]="'audit-event__outcome audit-event__outcome--' + event.status">
        <strong>{{ outcome }}</strong>
        @if (event.statusCode) {
          <span>HTTP {{ event.statusCode }}</span>
        }
        @if (duration) {
          <span>took {{ duration }}</span>
        }
      </div>

      @for (group of groups; track group.title) {
        <section class="audit-event__group">
          <h3 class="audit-event__group-title">{{ group.title }}</h3>
          <dl class="audit-event__ledger">
            @for (row of group.rows; track row.label) {
              <div class="audit-event__row">
                <dt>{{ row.label }}</dt>
                <dd [class.audit-event__mono]="row.mono" [matTooltip]="row.tooltip ?? ''" matTooltipPosition="above">
                  {{ row.value }}
                </dd>
                @if (row.copy) {
                  <button
                    matIconButton
                    class="icon-btn--small audit-event__copy"
                    [attr.aria-label]="'Copy ' + row.label"
                    (click)="copy(row.value)">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                }
              </div>
            }
          </dl>
        </section>
      }

      <p class="audit-event__footnote">* Times are shown in your local timezone ({{ timezoneLabel }})</p>
    </div>

    <div mat-dialog-actions align="end">
      @if (data.canFilterResource && event.resourceId) {
        <button type="button" matButton="outlined" class="audit-event__filter" (click)="filterResource()">
          <mat-icon>manage_search</mat-icon>
          All events for this resource
        </button>
      }
      <button type="button" matButton="filled" mat-dialog-close>Close</button>
    </div>
  `,
  styles: `
    .audit-event {
      box-sizing: border-box;
      color: var(--mat-sys-on-surface);
    }

    .audit-event__head {
      display: block;
      padding-bottom: 0.75rem;
    }

    .audit-event__title {
      margin: 0;
      font: var(--mat-sys-headline-small);
      font-family: var(--headline-font), sans-serif;
      color: var(--mat-sys-on-surface);
    }

    .audit-event__subline {
      margin: 0.25rem 0 0;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
      overflow-wrap: anywhere;
    }

    .audit-event__outcome {
      --outcome-bar: var(--blue-50);
      --outcome-bg: light-dark(var(--blue-20), color-mix(in srgb, var(--blue-50) 35%, transparent));

      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.25rem 1.5rem;
      padding: 0.75rem 1rem;
      border-left: 4px solid var(--outcome-bar);
      border-radius: var(--br-medium);
      background: var(--outcome-bg);
      font: var(--mat-sys-body-medium);
      font-variant-numeric: tabular-nums;

      strong {
        font: var(--mat-sys-title-medium);
      }

      &--success {
        --outcome-bar: var(--green-50);
        --outcome-bg: light-dark(var(--green-20), color-mix(in srgb, var(--green-50) 35%, transparent));
      }

      &--failed {
        --outcome-bar: var(--red-50);
        --outcome-bg: light-dark(var(--red-20), color-mix(in srgb, var(--red-50) 35%, transparent));
      }
    }

    .audit-event__group {
      padding-block: 0.875rem 0.5rem;

      & + & {
        border-top: 1px solid var(--stroke-default);
      }
    }

    .audit-event__group-title {
      margin: 0 0 0.25rem;
      font: var(--mat-sys-title-small);
    }

    .audit-event__ledger {
      margin: 0;
    }

    .audit-event__row {
      display: grid;
      grid-template-columns: 8rem minmax(0, 1fr) 32px;
      align-items: center;
      column-gap: 0.75rem;
      min-height: 34px;
      margin-inline: -0.5rem;
      padding-inline: 0.5rem;
      border-radius: var(--br-medium);

      &:hover,
      &:focus-within {
        background: var(--component-hover);
      }

      dt {
        font: var(--mat-sys-body-medium);
        color: var(--mat-sys-on-surface-variant);
      }

      dd {
        margin: 0;
        padding-block: 0.25rem;
        font: var(--mat-sys-body-large);
        overflow-wrap: anywhere;
      }

      dd.audit-event__mono {
        font-family: JetBrainsMono, monospace;
        font-size: 0.8125rem;
        font-variant-numeric: tabular-nums;
      }
    }

    .audit-event__copy {
      grid-column: 3;
      opacity: 0.45;
      transition: opacity 120ms ease-out;
    }

    .audit-event__row:hover .audit-event__copy,
    .audit-event__copy:focus-visible {
      opacity: 1;
    }

    .audit-event__footnote {
      margin: 0.25rem 0 0;
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .audit-event__filter {
      margin-right: auto;
    }

    // Material caps dialog content at 65vh. 260px covers the title, the actions and the padding.
    @media (min-width: 601px) {
      .audit-event {
        max-height: calc(100dvh - 260px);
      }
    }

    @media (hover: none) {
      .audit-event__copy {
        opacity: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .audit-event__copy {
        transition: none;
      }
    }

    @media (max-width: 600px) {
      .audit-event__row {
        grid-template-columns: minmax(0, 1fr) 32px;
        padding-block: 0.375rem;

        dt {
          grid-column: 1 / -1;
        }

        dd {
          padding-block: 0;
        }
      }

      .audit-event__copy {
        grid-column: 2;
      }
    }
  `,
})
export class AuditEventDialog {
  readonly dialogRef = inject(MatDialogRef<AuditEventDialog, AuditEventDialogResult>);
  readonly data = inject<AuditEventDialogData>(MAT_DIALOG_DATA);
  private readonly clipboard = inject(Clipboard);
  private readonly snackbar = inject(MatSnackBar);
  private readonly locale = inject(LOCALE_ID);

  protected readonly event = this.data.event;
  protected readonly timezoneLabel = localTimezoneLabel();
  protected readonly title = this.data.display.label;
  protected readonly subline = [
    this.event.userEmail || this.event.userId,
    formatDate(this.event.startedAt, 'medium', this.locale),
  ]
    .filter(Boolean)
    .join(', ');
  protected readonly outcome =
    this.event.status === 'attempted' ? 'Attempted, no outcome recorded' : auditStatusChip(this.event.status).label;
  protected readonly duration = this.formatDuration();
  protected readonly groups = this.buildGroups();

  filterResource() {
    this.dialogRef.close({ filterResourceId: this.event.resourceId! });
  }

  copy(value: string) {
    this.clipboard.copy(value);
    this.snackbar.open('Copy to clipboard!', undefined, {
      horizontalPosition: 'end',
      duration: 3000,
    });
  }

  // Empty values produce no row
  private buildGroups(): LedgerGroup[] {
    const e = this.event;
    const row = (label: string, value: string | undefined, options: Partial<LedgerRow> = {}): LedgerRow[] =>
      value ? [{ label, value, ...options }] : [];
    const id = { mono: true, copy: true };

    const groups: LedgerGroup[] = [
      {
        title: 'Who',
        rows: [
          ...row('Initiator', e.userEmail),
          ...row('User ID', e.userId, id),
          ...row('Signed in with', e.authType),
        ],
      },
      {
        title: 'What',
        rows: [
          ...row('Resource', this.data.display.resourceLabel),
          ...row('Resource ID', e.resourceId, id),
          ...row('Project', e.projectId ? this.data.projectName || 'Deleted or unknown project' : undefined),
          ...row('Project ID', e.projectId, id),
        ],
      },
      {
        title: 'Origin',
        rows: [
          ...row('Source IP', e.sourceIp, {
            mono: true,
            tooltip: 'Client address taken from the proxy headers',
          }),
        ],
      },
      {
        title: 'Trace',
        rows: [
          ...row('Started', this.formatTime(e.startedAt), { tooltip: this.formatUtc(e.startedAt) }),
          ...row('Completed', e.completedAt ? this.formatTime(e.completedAt) : 'Outcome never recorded', {
            tooltip: e.completedAt ? this.formatUtc(e.completedAt) : undefined,
          }),
          ...row('Request ID', e.requestId, id),
          ...row('Event ID', e.id, id),
          ...row('Event type', e.eventType, { mono: true }),
        ],
      },
    ];

    return groups.filter(g => g.rows.length > 0);
  }

  private formatTime(date: Date) {
    return formatDate(date, 'mediumDate', this.locale) + ', ' + formatDate(date, 'HH:mm:ss.SSS', this.locale);
  }

  private formatUtc(date: Date) {
    return formatDate(date, 'yyyy-MM-dd HH:mm:ss.SSS', this.locale, 'UTC') + ' UTC';
  }

  private formatDuration() {
    if (!this.event.completedAt) {
      return '';
    }
    const ms = this.event.completedAt.getTime() - this.event.startedAt.getTime();
    return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
  }
}
