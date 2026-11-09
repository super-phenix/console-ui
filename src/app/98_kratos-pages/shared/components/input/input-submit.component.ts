import { DatePipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { I18nDirective } from '@kratos-pages/shared/i18n/i18n.directive';
import { I18nService } from '@kratos-pages/shared/i18n/i18n.service';
import { UiNodeInputAttributes, UiNodeMeta } from '@ory/client';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const DANGER_ACTIONS = ['totp_unlink', 'webauthn_remove', 'lookup_secret_disable'];
const SECONDARY_ACTIONS = [...DANGER_ACTIONS, 'lookup_secret_regenerate', 'lookup_secret_reveal'];

@Component({
  selector: 'spx-auth-input-submit',
  imports: [DatePipe, ReactiveFormsModule, I18nDirective, MatButtonModule, MatIconModule],
  templateUrl: './input-submit.component.html',
  styleUrls: ['./input.component.scss', './input-submit.component.scss'],
})
export class InputSubmitComponent {
  @Input() form!: FormGroup;
  @Input() attributes!: UiNodeInputAttributes;
  @Input() meta!: UiNodeMeta;

  protected i18n = inject(I18nService);

  /**
   * Kratos has no node for a registered key: its details are in the context of its remove button.
   */
  get securityKey() {
    return this.attributes.name === 'webauthn_remove'
      ? (this.meta.label?.context as { display_name: string; added_at: string })
      : undefined;
  }

  get appearance() {
    if (this.back) {
      return 'text';
    }
    return SECONDARY_ACTIONS.includes(this.attributes.name) ? 'outlined' : 'filled';
  }

  get back() {
    return this.attributes.name === 'screen';
  }

  get secondary() {
    return SECONDARY_ACTIONS.includes(this.attributes.name);
  }

  get danger() {
    return DANGER_ACTIONS.includes(this.attributes.name);
  }

  /**
   * Calls the function Kratos names rather than evaluating `onclick`. Without arguments,
   * it reads its options from this button's value, then submits the form itself.
   */
  protected trigger() {
    const name = this.attributes.onclickTrigger;
    if (name) {
      (window as unknown as Record<string, () => void>)[name]();
    }
  }
}
