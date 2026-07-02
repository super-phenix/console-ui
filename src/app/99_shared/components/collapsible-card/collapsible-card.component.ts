import { Component, input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

/**
 * Collapsible variant of the standard `.info-card`: a flat, bordered container
 * with an icon header that expands/collapses. Wraps a `mat-expansion-panel`
 * (native animation, content stays in the DOM) flattened to drop the Material
 * elevation. Project the body as content.
 */
@Component({
  selector: 'spx-collapsible-card',
  imports: [MatExpansionModule, MatIconModule],
  templateUrl: './collapsible-card.component.html',
  styleUrl: './collapsible-card.component.scss',
})
export class CollapsibleCardComponent {
  icon = input.required<string>();
  title = input.required<string>();
  expanded = input<boolean>(false);
}
