import { TestBed } from '@angular/core/testing';
import { UiNodeScriptAttributes } from '@ory/client';
import { WebauthnScriptService } from './webauthn-script.service';

describe('WebauthnScriptService', () => {
  let service: WebauthnScriptService;

  const attributes = {
    node_type: 'script',
    id: 'spx_test_script',
    src: 'data:text/javascript,',
    type: 'text/javascript',
    async: true,
    crossorigin: 'anonymous',
    integrity: 'sha512-test',
    referrerpolicy: 'no-referrer',
    nonce: 'nonce',
  } as UiNodeScriptAttributes;

  const scripts = () => document.querySelectorAll<HTMLScriptElement>('#spx_test_script');

  beforeEach(() => {
    service = TestBed.inject(WebauthnScriptService);
  });

  afterEach(() => scripts().forEach(script => script.remove()));

  it('should add the script once with its integrity', () => {
    service.load(attributes);
    service.load(attributes);

    expect(scripts().length).toBe(1);
    expect(scripts()[0].integrity).toBe('sha512-test');
    expect(service.state()).toBe('loading');
  });

  it('should stay ready across flows once the script is loaded', () => {
    service.load(attributes);
    scripts()[0].dispatchEvent(new Event('load'));
    service.load(attributes);

    expect(service.state()).toBe('ready');
    expect(scripts().length).toBe(1);
  });

  it('should try again after a failed download', () => {
    service.load(attributes);
    scripts()[0].dispatchEvent(new Event('error'));

    expect(service.state()).toBe('failed');
    expect(scripts().length).toBe(0);

    service.load(attributes);

    expect(service.state()).toBe('loading');
    expect(scripts().length).toBe(1);
  });
});
