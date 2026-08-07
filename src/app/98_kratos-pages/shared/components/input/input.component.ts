import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UiNode } from '@ory/client';
import { InputDefaultComponent } from './input-default.component';
import { InputSubmitComponent } from './input-submit.component';

@Component({
  selector: 'spx-auth-input',
  imports: [ReactiveFormsModule, InputSubmitComponent, InputDefaultComponent],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent {
  @Input() node!: UiNode;
  @Input() form!: FormGroup;
}
