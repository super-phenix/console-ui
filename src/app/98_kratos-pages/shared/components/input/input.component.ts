import { Component, inject, Input, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { I18nService } from '@kratos-pages/shared/i18n/i18n.service';
import { WebauthnScriptService } from '@kratos-pages/shared/services/webauthn-script.service';
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
  private webauthnScript = inject(WebauthnScriptService);

  ngOnInit() {
    if (this.node.attributes.node_type === 'script') {
      this.webauthnScript.load(this.node.attributes);
    }
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
