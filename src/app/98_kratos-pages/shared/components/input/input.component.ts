import { Component, inject, Input, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { I18nService } from '@kratos-pages/shared/i18n/i18n.service';
import { UiNode, UiNodeTextAttributes, UiText } from '@ory/client';
import { InputDefaultComponent } from './input-default.component';
import { InputSubmitComponent } from './input-submit.component';

@Component({
  selector: 'spx-auth-input',
  imports: [ReactiveFormsModule, InputSubmitComponent, InputDefaultComponent],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent implements OnInit {
  @Input() node!: UiNode;
  @Input() form!: FormGroup;

  private i18n = inject(I18nService);

  /**
   * Angular strips scripts from templates, so the one Kratos sends for WebAuthn is added by hand.
   * It stays loaded across flows and only registers global functions.
   */
  ngOnInit() {
    const attributes = this.node.attributes;
    if (attributes.node_type !== 'script' || document.getElementById(attributes.id)) {
      return;
    }
    const script = document.createElement('script');
    script.id = attributes.id;
    script.src = attributes.src;
    script.type = attributes.type;
    script.async = attributes.async;
    script.crossOrigin = attributes.crossorigin;
    script.integrity = attributes.integrity;
    script.referrerPolicy = attributes.referrerpolicy;
    script.nonce = attributes.nonce;
    document.body.appendChild(script);
  }

  get label(): string {
    const label = this.node.meta.label;
    if (!label) {
      return '';
    }
    return this.i18n.getTranslation(label.type, String(label.id)) ?? label.text;
  }

  get secrets(): UiText[] {
    const context = (this.node.attributes as UiNodeTextAttributes).text.context as { secrets?: UiText[] } | undefined;
    return context?.secrets ?? [];
  }
}
