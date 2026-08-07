import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { I18nDirective } from '@kratos-pages/shared/i18n/i18n.directive';
import { UiNodeInputAttributes, UiNodeMeta, UiText } from '@ory/client';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'spx-auth-input-default',
  imports: [ReactiveFormsModule, I18nDirective, MatFormFieldModule, MatInputModule],
  templateUrl: './input-default.component.html',
  styleUrls: ['./input.component.scss', './input-default.component.scss'],
})
export class InputDefaultComponent {
  @Input() form!: FormGroup;
  @Input() attributes!: UiNodeInputAttributes;
  @Input() meta!: UiNodeMeta;
  @Input() messages!: UiText[];
}
