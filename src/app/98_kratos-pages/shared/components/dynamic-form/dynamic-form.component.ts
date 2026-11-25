import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18nDirective } from '@kratos-pages/shared/i18n/i18n.directive';
import { I18nService } from '@kratos-pages/shared/i18n/i18n.service';
import { LoginFlow, RecoveryFlow, RegistrationFlow, SettingsFlow, UiNode, VerificationFlow } from '@ory/client';
import { InputComponent } from '@kratos-pages/shared/components/input/input.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface FormGroupNodes {
  name: string;
  nodes: UiNode[];
  enabled: boolean;
  actionsOnly: boolean;
  back: boolean;
}

const GROUP_ORDER = ['profile', 'password', 'totp', 'webauthn', 'lookup_secret'];
const ENABLED_NODES = ['totp_unlink', 'webauthn_remove', 'lookup_secret_reveal', 'lookup_secret_disable'];

const inputOf = (node: UiNode) => (node.attributes.node_type === 'input' ? node.attributes : undefined);
const groupRank = (name: string) => {
  const rank = GROUP_ORDER.indexOf(name);
  return rank < 0 ? GROUP_ORDER.length : rank;
};

@Component({
  selector: 'spx-auth-dynamic-form',
  imports: [ReactiveFormsModule, InputComponent, I18nDirective, MatFormFieldModule, MatInputModule],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss',
})
export class DynamicFormComponent {
  private _flow!: LoginFlow | RegistrationFlow | SettingsFlow | RecoveryFlow | VerificationFlow;
  protected ready = signal(false);
  protected groups = signal<FormGroupNodes[]>([]);
  protected severalMethods = computed(() => this.groups().filter(group => !group.back).length > 1);
  protected i18n = inject(I18nService);
  protected passwordConfirmation = new FormControl('');
  protected passwordMismatch = signal(false);

  /**
   * Determine if the form send automaticly or transmit the event
   */
  @Input() manual = false;

  /**
   * Show each group as a section with its description and status, for pages with many groups
   */
  @Input() sections = false;

  /**
   * Ask for new passwords twice. Kratos only has one password field, so this one stays in the
   * console: it has no name, and the browser leaves it out of the submitted form.
   */
  @Input() confirmPassword = false;

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

    this.groups.set(this.splitByGroup(this.flow.ui.nodes));
    this.formChange.emit(form);
    this.ready.set(true);
  }

  /**
   * Each Kratos method has its own required inputs and submit button: in one shared form,
   * an empty password would block the browser from submitting a TOTP code.
   * Visible `default` nodes (identifier, traits) belong to every method, so they keep one form.
   */
  private splitByGroup(nodes: UiNode[]): FormGroupNodes[] {
    const shared = nodes.filter(node => node.group === 'default');
    const names = [...new Set(nodes.map(node => node.group))]
      .filter(name => name !== 'default')
      .sort((a, b) => groupRank(a) - groupRank(b));
    const onlyHiddenShared = shared.every(node => inputOf(node)?.type === 'hidden');

    if (!names.length || !onlyHiddenShared) {
      return [{ name: 'default', nodes, enabled: false, actionsOnly: false, back: false }];
    }
    const groups = names.map(name => {
      const own = nodes.filter(node => node.group === name);
      // Kratos sends the Back button of two-step registration as the only `profile` node.
      const back = own.length === 1 && inputOf(own[0])?.name === 'screen';
      return {
        name,
        nodes: [...shared, ...own],
        enabled: own.some(node => ENABLED_NODES.includes(inputOf(node)?.name ?? '')),
        actionsOnly: !back && own.every(node => inputOf(node)?.type === 'submit'),
        back,
      };
    });
    return groups.sort((a, b) => Number(a.back) - Number(b.back));
  }

  protected isHidden(node: UiNode) {
    return node.type === 'script' || inputOf(node)?.type === 'hidden';
  }

  protected isPassword(node: UiNode) {
    return inputOf(node)?.name === 'password';
  }

  protected checkPasswordConfirmation(event: SubmitEvent) {
    const submitter = event.submitter as HTMLButtonElement | null;
    const mismatch =
      this.confirmPassword &&
      submitter?.value === 'password' &&
      this.form.get('password')?.value !== this.passwordConfirmation.value;

    this.passwordMismatch.set(mismatch);
    if (mismatch) {
      event.preventDefault();
    }
  }

  protected isSecurityKey(node: UiNode) {
    return inputOf(node)?.name === 'webauthn_remove';
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
