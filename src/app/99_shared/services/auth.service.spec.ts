import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';
import { StateService } from './state.service';

// Build a decodable JWT whose payload carries the given expiry (epoch seconds).
function makeToken(expEpochSec: number): string {
  return `header.${btoa(JSON.stringify({ exp: expEpochSec }))}.sig`;
}

const nowSec = () => Math.floor(Date.now() / 1000);
const tokenUrl = environment.session.token;

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: StateService, useValue: { onLogin: () => undefined } },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('dedupes concurrent renewals into a single request', async () => {
    const p1 = service.renewAccessToken();
    const p2 = service.renewAccessToken();

    const req = httpMock.expectOne(tokenUrl); // a second request would fail expectOne
    req.flush({ session: 'fresh-token', user: { id: 'u1' } });

    await Promise.all([p1, p2]);
    expect(service.accessToken()).toBe('fresh-token');
  });

  it('rejects when the session can no longer be renewed', async () => {
    const p = service.renewAccessToken();
    httpMock.expectOne(tokenUrl).flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    await expectAsync(p).toBeRejected();
  });

  it('ensureValidToken renews an expired token before use', async () => {
    service.setAccessToken(makeToken(nowSec() - 60));

    const p = service.ensureValidToken();
    httpMock.expectOne(tokenUrl).flush({ session: 'renewed', user: { id: 'u1' } });

    await p;
    expect(service.accessToken()).toBe('renewed');
  });

  it('ensureValidToken renews a token within the autoRenew window', async () => {
    service.setAccessToken(makeToken(nowSec() + (environment.session.autoRenew - 1) * 60));

    const p = service.ensureValidToken();
    httpMock.expectOne(tokenUrl).flush({ session: 'renewed', user: { id: 'u1' } });

    await p;
    expect(service.accessToken()).toBe('renewed');
  });

  it('ensureValidToken is a no-op for a fresh token', async () => {
    const token = makeToken(nowSec() + 3600);
    service.setAccessToken(token);
    await service.ensureValidToken();
    httpMock.expectNone(tokenUrl);
    expect(service.accessToken()).toBe(token);
  });

  it('openLoginPopup targets the auth-ui login flow with a return path', () => {
    const open = spyOn(window, 'open').and.returnValue(null);
    service.openLoginPopup('/auth-complete');
    expect(open).toHaveBeenCalledWith(
      `${environment.url.auth}/ui/login?return_to=${window.location.origin}/auth-complete`,
      '_blank'
    );
  });
});
