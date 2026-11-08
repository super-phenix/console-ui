import { API_TOKEN_URL, environment } from '@env/environment';
import { redirectLimit } from '@shared/utils/redirect-limit';
import { kratosApiAuth } from './kratos-api-auth';

describe('kratosApiAuth.exchange', () => {
  it('navigates to the token endpoint so the API can redirect back here', async () => {
    const to = spyOn(redirectLimit, 'once').and.returnValue(true);

    await kratosApiAuth.exchange('https://localhost:4200/dashboard');

    expect(to).toHaveBeenCalledWith(
      `${API_TOKEN_URL}?return_to=${encodeURIComponent('https://localhost:4200/dashboard')}`
    );
  });

  it('rejects when the redirect limit is reached', async () => {
    spyOn(redirectLimit, 'once').and.returnValue(false);

    await expectAsync(kratosApiAuth.exchange(null)).toBeRejected();
  });
});

describe('kratosApiAuth.exchangeIfSession', () => {
  it('starts the API exchange when Kratos already has a session', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(new Response(null, { status: 200 }));
    const exchange = spyOn(kratosApiAuth, 'exchange').and.resolveTo();

    await expectAsync(kratosApiAuth.exchangeIfSession('https://localhost:4200/')).toBeResolvedTo(true);

    expect(fetchSpy).toHaveBeenCalledWith(`${environment.authUrl}/sessions/whoami`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    expect(exchange).toHaveBeenCalledWith('https://localhost:4200/');
  });

  it('does not exchange when Kratos has no session', async () => {
    spyOn(window, 'fetch').and.resolveTo(new Response(null, { status: 401 }));
    const exchange = spyOn(kratosApiAuth, 'exchange').and.resolveTo();

    await expectAsync(kratosApiAuth.exchangeIfSession(null)).toBeResolvedTo(false);

    expect(exchange).not.toHaveBeenCalled();
  });
});
