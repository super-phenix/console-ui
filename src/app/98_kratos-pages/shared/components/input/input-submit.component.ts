import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { I18nDirective } from '@kratos-pages/shared/i18n/i18n.directive';
import { UiNodeInputAttributes, UiNodeMeta } from '@ory/client';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'spx-auth-input-submit',
  imports: [ReactiveFormsModule, I18nDirective, MatButtonModule],
  templateUrl: './input-submit.component.html',
  styleUrls: ['./input.component.scss', './input-submit.component.scss'],
})
export class InputSubmitComponent {
  @Input() form!: FormGroup;
  @Input() attributes!: UiNodeInputAttributes;
  @Input() meta!: UiNodeMeta;
}
