import { Directive, ElementRef, Input, effect, inject } from '@angular/core';
import { I18nService } from './i18n.service';

/**
 * This directive add an automatic translation
 * if found in `locale/en.json` using the i18n Service
 *
 * @fires {@link I18nService#getTranslation}
 *
 *
 * @example
 * <!-- in `dynamic-form.component.html`, for example -->
 * <span
 *   appI18n
 *   [id]="msg.id"
 *   [group]="msg.type"
 *   [context]="msg.context">
 *   {{ msg.text }}
 * </span>
 */
@Directive({
  selector: '[appI18n]',
  standalone: true,
})
export class I18nDirective {
  @Input() id?: string | number;
  @Input() group?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() context?: any;

  protected el = inject(ElementRef<HTMLElement>);
  protected i18n = inject(I18nService);

  constructor() {
    effect(() => {
      if (this.group && this.id) {
        const translate = this.i18n.getTranslation(this.group, String(this.id), this.context);

        if (translate) {
          this.el.nativeElement.innerHTML = translate;
        }
      }
    });
  }
}
