import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { readStoredAccessToken, writeStoredAccessToken } from '@shared/services/access-token-storage';
import { redirectLimit } from '@shared/utils/redirect-limit';

import { CallbackComponent } from './callback.component';

describe('CallbackComponent', () => {
  beforeEach(() => {
    spyOn(redirectLimit, 'to').and.returnValue(true);
  });

  function create(params: Record<string, string> = {}) {
    const navigate = jasmine.createSpy('navigate');
    TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(params) } } },
      ],
    });
    const to = redirectLimit.to as jasmine.Spy;
    to.calls.reset();
    const fixture = TestBed.createComponent(CallbackComponent);
    return { fixture, to, navigate };
  }

  it('should create', () => {
    expect(create().fixture.componentInstance).toBeTruthy();
  });

  it('follows a same-origin path from return_to', () => {
    const { to } = create({ return_to: '/products/compute' });

    expect(to).toHaveBeenCalledOnceWith(`${document.baseURI.slice(0, -1)}/products/compute`);
  });

  it('falls back to the app root when return_to would change the host', () => {
    const root = `${document.baseURI.slice(0, -1)}/`;

    for (const returnTo of ['@evil.com', '.evil.com', '//evil.com', '/\\evil.com', 'https://evil.com']) {
      TestBed.resetTestingModule();
      expect(create({ return_to: returnTo }).to).toHaveBeenCalledOnceWith(root);
    }
  });

  it('does not store an access token supplied in the query string', () => {
    writeStoredAccessToken('existing-token');

    create({ session: 'attacker.jwt', return_to: '/' });

    expect(readStoredAccessToken()).toBe('existing-token');
    writeStoredAccessToken(undefined);
  });

  it('opens the inactive account page without following return_to', () => {
    const { to, navigate } = create({ not_active: 'true', return_to: '@evil.com' });

    expect(navigate).toHaveBeenCalledOnceWith(['/', 'inactive-account']);
    expect(to).not.toHaveBeenCalled();
  });
});
