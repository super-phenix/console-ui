import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QuotaResourceEnum } from '@shared/models/data/quota';
import {
  buildQuotaBar,
  formatQuotaQuantity,
  QUOTA_CHILDREN_LABELS,
  QUOTA_RESOURCE_ICONS,
  QUOTA_RESOURCE_LABELS,
  QuotaBarPart,
  QuotaParentType,
} from '@shared/utils/quota';

/** Number of colors of the palette, see `_quota-palette.scss` */
export const QUOTA_BAR_COLORS = 8;

/** Class giving the color of the child at `index` (`--quota-color` and background) */
export function quotaColorClass(prefix: string, index: number) {
  return `${prefix}-${index % QUOTA_BAR_COLORS}`;
}

/**
 * Bar of one quota resource, split among the children sharing it
 * (projects of an organization, AZs of a project).
 */
@Component({
  selector: 'spx-quota-bar',
  imports: [MatIconModule, MatTooltipModule, DecimalPipe],
  templateUrl: './quota-bar.component.html',
  styleUrl: './quota-bar.component.scss',
})
export class QuotaBarComponent {
  resource = input.required<QuotaResourceEnum>();
  /** Limit of the parent, null when not limited */
  limit = input.required<number | null>();
  parts = input.required<QuotaBarPart[]>();
  /** Who holds the limit, to name its children in the messages */
  parentType = input.required<QuotaParentType>();

  bar = computed(() => buildQuotaBar(this.limit(), this.parts()));
  label = computed(() => QUOTA_RESOURCE_LABELS[this.resource()]);
  icon = computed(() => QUOTA_RESOURCE_ICONS[this.resource()]);
  overcommittedTooltip = computed(
    () => `The ${QUOTA_CHILDREN_LABELS[this.parentType()]} exceed this quota: they can only be lowered`
  );

  format(value: number) {
    return formatQuotaQuantity(this.resource(), value);
  }

  colorClass(index: number) {
    return quotaColorClass('quota-bar__color', index);
  }
}
