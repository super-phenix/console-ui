import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { SettingsFlow } from '@ory/client';
import { DynamicFormComponent } from './dynamic-form.component';

const input = (group: string, name: string, type: string, required = false) => ({
  type: 'input',
  group,
  attributes: { node_type: 'input', name, type, required, value: type === 'submit' ? group : undefined },
  meta: { label: type === 'hidden' ? undefined : { id: 1, text: name, type: 'info' } },
  messages: [],
});

const csrf = input('default', 'csrf_token', 'hidden', true);

describe('DynamicFormComponent', () => {
  let fixture: ComponentFixture<DynamicFormComponent>;

  function render(nodes: unknown[], manual = false): HTMLFormElement[] {
    fixture.componentRef.setInput('form', new FormGroup({}));
    fixture.componentRef.setInput('manual', manual);
    fixture.componentInstance.formChange.subscribe(form => fixture.componentRef.setInput('form', form));
    fixture.componentRef.setInput('flow', {
      ui: { action: 'http://kratos/self-service', method: 'POST', nodes, messages: [] },
    } as unknown as SettingsFlow);
    fixture.detectChanges();
    return Array.from(fixture.nativeElement.querySelectorAll('form'));
  }

  const names = (form: HTMLFormElement) =>
    Array.from(form.querySelectorAll('input, button')).map(element => element.getAttribute('name'));

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DynamicFormComponent] });
    fixture = TestBed.createComponent(DynamicFormComponent);
  });

  it('should give each method its own form with the csrf token', () => {
    const forms = render([
      csrf,
      input('totp', 'totp_code', 'text', true),
      input('totp', 'method', 'submit'),
      input('lookup_secret', 'lookup_secret', 'text', true),
      input('lookup_secret', 'method', 'submit'),
    ]);

    expect(forms.length).toBe(2);
    expect(names(forms[0])).toEqual(['csrf_token', 'totp_code', 'method']);
    expect(names(forms[1])).toEqual(['csrf_token', 'lookup_secret', 'method']);
  });

  it('should title the known groups', () => {
    render([csrf, input('totp', 'totp_code', 'text'), input('lookup_secret', 'lookup_secret', 'text')]);

    const titles = Array.from(fixture.nativeElement.querySelectorAll('h2')).map(
      title => (title as HTMLElement).textContent
    );
    expect(titles).toEqual(['Authenticator app', 'Backup codes']);
  });

  it('should put the authenticator app before the backup codes', () => {
    const forms = render([csrf, input('lookup_secret', 'lookup_secret', 'text'), input('totp', 'totp_code', 'text')]);

    expect(names(forms[0])).toContain('totp_code');
    expect(names(forms[1])).toContain('lookup_secret');
  });

  it('should keep the security key inputs in one form, between the app and the backup codes', () => {
    const forms = render([
      csrf,
      input('lookup_secret', 'lookup_secret_regenerate', 'submit'),
      input('webauthn', 'webauthn_register_displayname', 'text'),
      input('webauthn', 'webauthn_register', 'hidden'),
      input('webauthn', 'webauthn_register_trigger', 'button'),
      {
        type: 'script',
        group: 'webauthn',
        attributes: { node_type: 'script', id: 'spx_form_script' },
        meta: {},
        messages: [],
      },
      input('totp', 'totp_code', 'text'),
    ]);

    expect(names(forms[0])).toContain('totp_code');
    expect(names(forms[1])).toEqual([
      'csrf_token',
      'webauthn_register_displayname',
      'webauthn_register',
      'webauthn_register_trigger',
    ]);
    expect(names(forms[2])).toContain('lookup_secret_regenerate');
    expect(forms[1].querySelectorAll('.dynamic-form__node--hidden').length).toBe(3);
    document.getElementById('spx_form_script')?.remove();
  });

  it('should replace the group title with a hint on a single security key step', () => {
    render([
      csrf,
      input('webauthn', 'webauthn_login', 'hidden'),
      input('webauthn', 'webauthn_login_trigger', 'button'),
    ]);

    expect(fixture.nativeElement.querySelector('.dynamic-form__group-title')).toBeNull();
    expect(fixture.nativeElement.querySelector('.dynamic-form__hint')?.textContent).toContain('hardware key');
  });

  describe('password confirmation', () => {
    const nodes = [csrf, input('password', 'password', 'password', true), input('password', 'method', 'submit')];

    function submit(password: string, confirmation: string) {
      const [form] = render(nodes);
      fixture.componentRef.setInput('form', fixture.componentInstance.form);
      fixture.detectChanges();
      fixture.componentInstance.form.get('password')?.setValue(password);
      const field = form.querySelector<HTMLInputElement>('input:not([name])') as HTMLInputElement;
      field.value = confirmation;
      field.dispatchEvent(new Event('input'));
      const event = new SubmitEvent('submit', { cancelable: true, submitter: form.querySelector('button') });
      form.dispatchEvent(event);
      fixture.detectChanges();
      return event;
    }

    beforeEach(() => fixture.componentRef.setInput('confirmPassword', true));

    it('should keep the confirmation out of the data sent to Kratos', () => {
      const [form] = render(nodes);

      expect(form.querySelectorAll('input[type="password"]').length).toBe(2);
      expect(names(form)).toContain(null);
    });

    it('should block the submit when the passwords differ', () => {
      expect(submit('first', 'second').defaultPrevented).toBeTrue();
      expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain("don't match");
    });

    it('should let the submit through when the passwords match', () => {
      expect(submit('same', 'same').defaultPrevented).toBeFalse();
    });

    it('should not add the field to other flows', () => {
      fixture.componentRef.setInput('confirmPassword', false);

      expect(render(nodes)[0].querySelectorAll('input[type="password"]').length).toBe(1);
    });
  });

  it('should show the registration Back button as a plain last action', () => {
    const forms = render([csrf, input('profile', 'screen', 'submit'), input('password', 'password', 'password', true)]);

    expect(names(forms[0])).toContain('password');
    expect(names(forms[1])).toEqual(['csrf_token', 'screen']);
    expect(fixture.nativeElement.querySelector('.dynamic-form__group-title')).toBeNull();
    expect(forms[1].classList.contains('dynamic-form__form--actions')).toBeFalse();
    expect(forms[1].querySelector('button')?.classList.contains('input__back')).toBeTrue();
  });

  it('should mark security keys as enabled once one is registered', () => {
    render([csrf, input('webauthn', 'webauthn_remove', 'submit')]);
    fixture.componentRef.setInput('sections', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dynamic-form__status')?.textContent).toBe('Enabled');
  });

  it('should show descriptions and the enabled status only as sections', () => {
    const nodes = [
      csrf,
      input('totp', 'totp_unlink', 'submit'),
      input('lookup_secret', 'lookup_secret_regenerate', 'submit'),
    ];

    render(nodes);
    expect(fixture.nativeElement.querySelector('.dynamic-form__hint')).toBeNull();
    expect(fixture.nativeElement.querySelector('.dynamic-form__status')).toBeNull();

    fixture.componentRef.setInput('sections', true);
    fixture.detectChanges();
    const sections = fixture.nativeElement.querySelectorAll('section');
    expect(sections[0].querySelector('.dynamic-form__status')?.textContent).toBe('Enabled');
    expect(sections[0].querySelector('.dynamic-form__hint')).not.toBeNull();
    expect(sections[1].querySelector('.dynamic-form__status')).toBeNull();
  });

  it('should not keep the previous button when the flow changes', () => {
    render([csrf, input('lookup_secret', 'lookup_secret_reveal', 'submit')]);
    const previous = fixture.nativeElement.querySelector('button[name=lookup_secret_reveal]');

    render([csrf, input('lookup_secret', 'lookup_secret_disable', 'submit')]);

    expect(previous.isConnected).toBeFalse();
    expect(fixture.nativeElement.querySelector('button[name=lookup_secret_disable]')).not.toBeNull();
  });

  it('should keep one form when default nodes are visible', () => {
    const forms = render([
      csrf,
      input('default', 'identifier', 'text', true),
      input('password', 'password', 'password', true),
      input('password', 'method', 'submit'),
      input('code', 'method', 'submit'),
    ]);

    expect(forms.length).toBe(1);
    expect(names(forms[0])).toEqual(['csrf_token', 'identifier', 'password', 'method', 'method']);
  });

  it('should keep one form when there are only default nodes', () => {
    expect(render([csrf]).length).toBe(1);
  });

  it('should keep one form in manual mode', () => {
    const forms = render(
      [csrf, input('totp', 'totp_code', 'text'), input('lookup_secret', 'lookup_secret', 'text')],
      true
    );

    expect(forms.length).toBe(1);
  });
});
