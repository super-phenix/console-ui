import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { BannerLevelEnum } from '@shared/models/enums';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';

export interface InstanceTypeSettingsDialogData {
  instanceTypeName: string;
  az: string;
}

interface SettingsEntry {
  label: string;
  value: string;
}

interface SettingsSection {
  title: string;
  entries: SettingsEntry[];
}

/** Read-only modal showing an instance type's full settings. */
@Component({
  selector: 'spx-instance-type-settings-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButtonModule, MatProgressSpinnerModule, BannerComponent],
  template: `
    <h2 mat-dialog-title>Instance type settings: {{ data.instanceTypeName }}</h2>

    <div mat-dialog-content>
      @if (instanceTypeResource.isLoading()) {
        <mat-spinner diameter="32"></mat-spinner>
      }

      @if (instanceTypeResource.error()) {
        <spx-banner [level]="BannerLevelEnum.Error">Failed to load instance type settings.</spx-banner>
      }

      @if (instanceTypeResource.hasValue() && instanceTypeResource.value()) {
        @for (section of sections(); track section.title) {
          <div class="info-card my-3">
            <div class="info-card__title">{{ section.title }}</div>
            <div class="info-card__content info-card__content--space-evenly">
              @for (entry of section.entries; track entry.label) {
                <div class="info-card__item info-card__item--fixed">
                  <div class="info-card__item-label">{{ entry.label }}</div>
                  <div class="info-card__item-text">{{ entry.value }}</div>
                </div>
              }
            </div>
          </div>
        }

        @if (sections().length === 0) {
          <spx-banner [level]="BannerLevelEnum.Info">No settings configured for this instance type.</spx-banner>
        }
      }
    </div>

    <div mat-dialog-actions align="end">
      <button type="button" matButton="filled" mat-dialog-close>Close</button>
    </div>
  `,
  styles: `
    .info-card__content--space-evenly {
      flex-wrap: wrap;
    }
  `,
})
export class InstanceTypeSettingsDialogComponent {
  protected stateSvc = inject(StateService);
  protected instanceSvc = inject(InstanceService);
  protected BannerLevelEnum = BannerLevelEnum;

  data = inject<InstanceTypeSettingsDialogData>(MAT_DIALOG_DATA);

  instanceTypeResource = rxResource({
    params: () => ({ name: this.data.instanceTypeName, az: this.data.az }),
    stream: ({ params: { name, az } }) => {
      const org = this.stateSvc.organization();
      const project = this.stateSvc.project();

      if (org && project && name && az) {
        return this.instanceSvc.getInstanceType(org.id, project.id, az, name);
      }
      return of(undefined);
    },
  });

  sections = computed<SettingsSection[]>(() => {
    const pref = this.instanceTypeResource.value();
    if (!pref) return [];

    const sectionKeys = ['clock', 'cpu', 'devices', 'features', 'firmware', 'machine', 'volumes'] as const;
    const result: SettingsSection[] = [];

    for (const key of sectionKeys) {
      const data = pref[key];
      if (data === undefined || data === null) continue;

      const entries = this.flattenObject(data as unknown as Record<string, unknown>, '');
      if (entries.length > 0) {
        result.push({ title: this.formatSectionTitle(key), entries });
      }
    }
    return result;
  });

  private formatSectionTitle(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  private formatLabel(key: string): string {
    return key
      .replace(/^preferred/, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  private formatValue(value: unknown): string {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    return JSON.stringify(value);
  }

  private flattenObject(obj: Record<string, unknown>, prefix: string): SettingsEntry[] {
    const entries: SettingsEntry[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;

      const label = prefix ? `${prefix} › ${this.formatLabel(key)}` : this.formatLabel(key);

      if (typeof value === 'object' && !Array.isArray(value)) {
        entries.push(...this.flattenObject(value as Record<string, unknown>, label));
      } else if (Array.isArray(value)) {
        entries.push({ label, value: JSON.stringify(value) });
      } else {
        entries.push({ label, value: this.formatValue(value) });
      }
    }
    return entries;
  }
}
