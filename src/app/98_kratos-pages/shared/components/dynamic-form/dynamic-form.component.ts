import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nDirective } from '@kratos-pages/shared/i18n/i18n.directive';
import { LoginFlow, RecoveryFlow, RegistrationFlow, SettingsFlow, VerificationFlow } from '@ory/client';
import { InputComponent } from '@kratos-pages/shared/components/input/input.component';

@Component({
  selector: 'spx-auth-dynamic-form',
  imports: [ReactiveFormsModule, InputComponent, I18nDirective],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss',
})
export class DynamicFormComponent {
  private _flow!: LoginFlow | RegistrationFlow | SettingsFlow | RecoveryFlow | VerificationFlow;
  protected ready = signal(false);

  /**
   * Determine if the form send automaticly or transmit the event
   */
  @Input() manual = false;

  @Input() form!: FormGroup;
  @Output() formChange = new EventEmitter<FormGroup>();
  @Output() submitForm = new EventEmitter<string>();

  get flow() {
    return this._flow;
  }

  @Input()
  set flow(flow) {
    this._flow = flow;
    this.initForm();
  }

  initForm() {
    const form = new FormGroup({});

    this.flow.ui.nodes.forEach(node => {
      if (node.attributes.node_type === 'input' && node.attributes.type !== 'submit') {
        const fc = node.attributes.required
          ? new FormControl(node.attributes.value || '', Validators.required)
          : new FormControl(node.attributes.value || '');
        form.addControl(node.attributes.name, fc);
      }
    });

    this.formChange.emit(form);
    this.ready.set(true);
  }

  submit(event: SubmitEvent) {
    console.log(event);
    if (event.submitter) {
      const name = event.submitter.attributes.getNamedItem('name')?.value;
      const value = event.submitter.attributes.getNamedItem('value')?.value;
      if (name && value) {
        const fc = new FormControl(value);
        this.form.addControl(name, fc);
      }
    }

    this.submitForm.emit(this.flow.ui.action);
  }
}
