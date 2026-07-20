import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { bucketPhaseChip } from '../../bucket-actions.utils';
import { ProductBucket } from '@products/00_shared/models/product.model';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { GridDirective } from '@shared/directives/grid.directive';

@Component({
  selector: 'spx-bucket-details-general',
  imports: [MatChipsModule, MatTooltipModule, DatePipe, SpanCopyComponent, GridDirective],
  templateUrl: './bucket-details-general.component.html',
})
export class BucketDetailsGeneralComponent {
  readonly bucketPhaseChip = bucketPhaseChip;

  bucket = input.required<ProductBucket>();
}
