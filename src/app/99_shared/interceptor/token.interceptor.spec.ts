import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../services/auth.service';
import { StateService } from '../services/state.service';
import { tokenInterceptor } from './token.interceptor';

function makeToken(expEpochSec: number): string {
  return `header.${btoa(JSON.stringify({ exp: expEpochSec }))}.sig`;
}
const nowSec = () => Math.floor(Date.now() / 1000);
// Drain pending microtasks (zoneless project: no fakeAsync available).
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

describe('tokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: StateService, useValue: { onLogin: () => undefined } },
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => httpMock.verify());

  it('renews a near-expiry token before sending and attaches the new bearer', async () => {
    auth.setAccessToken(makeToken(nowSec() + 60)); // within autoRenew window

    const result = firstValueFrom(http.get('/api/things'));

    // Pre-send renewal fires first (issued synchronously on subscribe).
    httpMock.expectOne(environment.session.token).flush({ session: 'newtok', user: { id: 'u' } });
    await flush();

    const req = httpMock.expectOne('/api/things');
    expect(req.request.headers.get('Authorization')).toBe('Bearer newtok');
    req.flush({});
    await expectAsync(result).toBeResolved();
  });

  it('attaches the existing bearer without renewing a fresh token', async () => {
    const token = makeToken(nowSec() + 3600);
    auth.setAccessToken(token);

    const result = firstValueFrom(http.get('/api/things'));
    await flush();

    const req = httpMock.expectOne('/api/things');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush({});
    await expectAsync(result).toBeResolved();
  });

  it('does not touch the session endpoint itself', async () => {
    auth.setAccessToken(makeToken(nowSec() - 60)); // stale, but URL is skipped

    const result = firstValueFrom(http.get(environment.session.token));
    const req = httpMock.expectOne(environment.session.token);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ session: 'x', user: { id: 'u' } });
    await expectAsync(result).toBeResolved();
  });

  it('leaves requests untouched when no user is logged in', async () => {
    const result = firstValueFrom(http.get('/api/anon'));
    const req = httpMock.expectOne('/api/anon');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
    await expectAsync(result).toBeResolved();
  });
});
