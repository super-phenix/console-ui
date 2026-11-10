import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { UiNode } from '@ory/client';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  let fixture: ComponentFixture<InputComponent>;

  function render(node: unknown): HTMLElement {
    fixture.componentRef.setInput('node', node as UiNode);
    fixture.componentRef.setInput('form', new FormGroup({}));
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [InputComponent] });
    fixture = TestBed.createComponent(InputComponent);
  });

  it('should render a button node as a button', () => {
    const element = render({
      type: 'input',
      group: 'webauthn',
      attributes: { node_type: 'input', name: 'webauthn_register_trigger', type: 'button', value: '{}' },
      meta: { label: { id: 1050012, text: 'Kratos text', type: 'info' } },
      messages: [],
    });

    expect(element.querySelector('button')?.getAttribute('type')).toBe('button');
    expect(element.querySelector('button')?.textContent).toContain('Add security key');
  });

  it('should add the WebAuthn script once with its integrity', () => {
    const script = {
      type: 'script',
      group: 'webauthn',
      attributes: {
        node_type: 'script',
        id: 'spx_test_script',
        src: 'data:text/javascript,',
        type: 'text/javascript',
        async: true,
        crossorigin: 'anonymous',
        integrity: 'sha512-test',
        referrerpolicy: 'no-referrer',
        nonce: 'nonce',
      },
      meta: {},
      messages: [],
    };

    render(script);
    const second = TestBed.createComponent(InputComponent);
    second.componentRef.setInput('node', script);
    second.componentRef.setInput('form', new FormGroup({}));
    second.detectChanges();

    const scripts = document.querySelectorAll<HTMLScriptElement>('#spx_test_script');
    expect(scripts.length).toBe(1);
    expect(scripts[0].integrity).toBe('sha512-test');
    scripts[0].remove();
  });

  it('should render the TOTP QR code with a translated alternative text', () => {
    const element = render({
      type: 'img',
      group: 'totp',
      attributes: { node_type: 'img', id: 'totp_qr', src: 'data:image/png;base64,AAAA', width: 256, height: 256 },
      meta: { label: { id: 1050005, text: 'Kratos text', type: 'info' } },
      messages: [],
    });

    const image = element.querySelector('img');
    expect(image?.getAttribute('src')).toBe('data:image/png;base64,AAAA');
    expect(image?.getAttribute('alt')).toBe('Authenticator app QR code');
  });

  it('should render the TOTP secret', () => {
    const element = render({
      type: 'text',
      group: 'totp',
      attributes: {
        node_type: 'text',
        id: 'totp_secret_key',
        text: { id: 1050006, text: 'ABCDEF', type: 'info', context: { secret: 'ABCDEF' } },
      },
      meta: { label: { id: 1050017, text: 'Kratos text', type: 'info' } },
      messages: [],
    });

    expect(element.querySelector('code')?.textContent).toBe('ABCDEF');
    expect(element.querySelector('p')?.textContent).toContain('authenticator app secret');
    expect(element.querySelector('li')).toBeNull();
  });

  it('should render every backup code', () => {
    const element = render({
      type: 'text',
      group: 'lookup_secret',
      attributes: {
        node_type: 'text',
        id: 'lookup_secret_codes',
        text: {
          id: 1050015,
          text: 'aaaa, bbbb',
          type: 'info',
          context: { secrets: [{ id: 1050009, text: 'aaaa', type: 'info' }, { id: 1050009, text: 'bbbb', type: 'info' }] },
        },
      },
      meta: { label: { id: 1050010, text: 'Kratos text', type: 'info' } },
      messages: [],
    });

    const codes = Array.from(element.querySelectorAll('li code')).map(code => code.textContent);
    expect(codes).toEqual(['aaaa', 'bbbb']);
  });

  it('should fall back on the Kratos text for an unknown label', () => {
    const element = render({
      type: 'text',
      group: 'totp',
      attributes: { node_type: 'text', id: 'x', text: { id: 1, text: 'value', type: 'info' } },
      meta: { label: { id: 9999999, text: 'Kratos text', type: 'info' } },
      messages: [],
    });

    expect(element.querySelector('p')?.textContent).toBe('Kratos text');
  });

  it('should render nothing for an unsupported node type', () => {
    const element = render({
      type: 'script',
      group: 'webauthn',
      attributes: { node_type: 'script', src: 'https://example.org/script.js' },
      meta: {},
      messages: [],
    });

    expect(element.querySelector('script, img, input, button')).toBeNull();
  });
});
