import { Clipboard } from '@angular/cdk/clipboard';
import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'spx-span-copy',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './span-copy.component.html',
  styleUrl: './span-copy.component.scss',
})
export class SpanCopyComponent {
  protected clipboard = inject(Clipboard);
  private readonly snackbar = inject(MatSnackBar);
  private readonly hostIsResourceId = inject(ElementRef).nativeElement.classList.contains(
    'product-details__card-eid'
  );

  key = input<string>();
  value = input.required<string | undefined>();
  /** Draw the value and its copy button as a compact id chip. */
  boxed = input(false, { transform: booleanAttribute });
  /** Keep the copy button hidden until the chip or its row is hovered. */
  copyOnHover = input(false, { transform: booleanAttribute });

  protected showBox = computed(
    () => this.boxed() || this.hostIsResourceId || /id$/i.test(this.key()?.trim() ?? '')
  );

  /** True when the value is clipped, so the end fades instead of showing an ellipsis. */
  protected readonly faded = signal(false);
  private readonly textRef = viewChild<ElementRef<HTMLElement>>('text');

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const el = this.textRef()?.nativeElement;
      if (!el) {
        return;
      }
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(el);
      if (el.parentElement) {
        observer.observe(el.parentElement);
      }
      this.measure();
      destroyRef.onDestroy(() => observer.disconnect());
    });

    effect(() => {
      this.value();
      this.textRef();
      requestAnimationFrame(() => this.measure());
    });
  }

  private measure(): void {
    const el = this.textRef()?.nativeElement;
    if (!el) {
      return;
    }
    this.faded.set(el.scrollWidth > el.clientWidth + 1);
  }

  copy() {
    if (this.value()) {
      this.clipboard.copy(this.value()!);
      this.snackbar.open('Copy to clipboard!', undefined, {
        horizontalPosition: 'end',
        duration: 3000,
      });
    }
  }
}
