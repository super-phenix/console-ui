import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { UiNodeInputAttributes } from '@ory/client';
import { InputSubmitComponent } from './input-submit.component';

describe('InputSubmitComponent', () => {
  let fixture: ComponentFixture<InputSubmitComponent>;

  function render(name: string): HTMLButtonElement {
    fixture.componentRef.setInput('form', new FormGroup({}));
    fixture.componentRef.setInput('attributes', { name, type: 'submit', value: 'true' } as unknown as UiNodeInputAttributes);
    fixture.componentRef.setInput('meta', {});
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('button');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [InputSubmitComponent] });
    fixture = TestBed.createComponent(InputSubmitComponent);
  });

  const tests: [string, boolean, boolean][] = [
    ['method', false, false],
    ['lookup_secret_confirm', false, false],
    ['lookup_secret_regenerate', true, false],
    ['lookup_secret_reveal', true, false],
    ['totp_unlink', true, true],
    ['webauthn_remove', true, true],
    ['lookup_secret_disable', true, true],
  ];

  tests.forEach(([name, secondary, danger]) => {
    it(`should style ${name}`, () => {
      const button = render(name);

      expect(fixture.componentInstance.secondary).toBe(secondary);
      expect(button.classList.contains('input__danger')).toBe(danger);
    });
  });

  it('should show a registered key with a short accessible remove button', () => {
    fixture.componentRef.setInput('form', new FormGroup({}));
    fixture.componentRef.setInput('attributes', { name: 'webauthn_remove', type: 'submit', value: 'id' } as unknown as UiNodeInputAttributes);
    fixture.componentRef.setInput('meta', {
      label: {
        id: 1050018,
        type: 'info',
        text: 'Remove security key "Laptop"',
        context: { display_name: 'Laptop', added_at: '2026-11-04T22:28:23Z' },
      },
    });
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const button = element.querySelector('button');
    expect(element.querySelector('.input__key-name')?.textContent).toBe('Laptop');
    expect(element.querySelector('.input__key-date')?.textContent).toContain('Added Nov 4, 2026');
    expect(button?.textContent).toContain('Remove');
    expect(button?.getAttribute('aria-label')).toBe('Remove security key "Laptop"');
  });

  it('should call the function Kratos names without evaluating onclick', () => {
    const registration = jasmine.createSpy('oryWebAuthnRegistration');
    const page = window as unknown as Record<string, unknown>;
    page['oryWebAuthnRegistration'] = registration;
    fixture.componentRef.setInput('form', new FormGroup({}));
    fixture.componentRef.setInput('attributes', {
      name: 'webauthn_register_trigger',
      type: 'button',
      value: '{}',
      onclick: 'window.spxOnclickWasEvaluated = true',
      onclickTrigger: 'oryWebAuthnRegistration',
    } as unknown as UiNodeInputAttributes);
    fixture.componentRef.setInput('meta', {});
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button').click();

    expect(registration).toHaveBeenCalledOnceWith();
    expect(page['spxOnclickWasEvaluated']).toBeUndefined();
    delete page['oryWebAuthnRegistration'];
  });
});
