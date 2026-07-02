import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { UnauthorizedSnackbar } from '../models/snackbar';
import { AuthService } from '../services/auth.service';
import { SessionRecoveryService } from '../services/session-recovery.service';
import { authErrorInterceptor } from './auth-error.interceptor';

const unauthorized = { status: 401, statusText: 'Unauthorized' };
// Drain pending microtasks (zoneless project: no fakeAsync available).
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

describe('authErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;
  let recovery: jasmine.SpyObj<SessionRecoveryService>;
  let snackbar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['renewAccessToken', 'accessToken']);
    recovery = jasmine.createSpyObj('SessionRecoveryService', ['recover']);
    snackbar = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: SessionRecoveryService, useValue: recovery },
        { provide: MatSnackBar, useValue: snackbar },
        provideHttpClient(withInterceptors([authErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('renews and replays the request once on 401', async () => {
    auth.renewAccessToken.and.resolveTo('newtok');
    auth.accessToken.and.returnValue('newtok');

    const result = firstValueFrom(http.get('/api/x'));
    httpMock.expectOne('/api/x').flush('no', unauthorized);
    await flush();

    const retry = httpMock.expectOne('/api/x');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer newtok');
    retry.flush({});

    await expectAsync(result).toBeResolved();
    expect(recovery.recover).not.toHaveBeenCalled();
  });

  it('falls back to recovery, then replays, when renewal fails', async () => {
    auth.renewAccessToken.and.rejectWith(new Error('refresh dead'));
    recovery.recover.and.resolveTo();
    auth.accessToken.and.returnValue('recovered');

    const result = firstValueFrom(http.get('/api/x'));
    httpMock.expectOne('/api/x').flush('no', unauthorized);
    await flush();

    expect(recovery.recover).toHaveBeenCalled();
    const retry = httpMock.expectOne('/api/x');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer recovered');
    retry.flush({});
    await expectAsync(result).toBeResolved();
  });

  it('shows the unauthorized snackbar and propagates when recovery is declined', async () => {
    auth.renewAccessToken.and.rejectWith(new Error('refresh dead'));
    recovery.recover.and.rejectWith(new Error('cancelled'));

    const result = firstValueFrom(http.get('/api/x'));
    httpMock.expectOne('/api/x').flush('no', unauthorized);
    await flush();

    expect(snackbar.open).toHaveBeenCalledWith(
      UnauthorizedSnackbar.message,
      UnauthorizedSnackbar.action,
      UnauthorizedSnackbar.config
    );
    await expectAsync(result).toBeRejected();
    httpMock.expectNone('/api/x'); // no replay
  });

  it('does not recover on a 401 from the session endpoint', async () => {
    const result = firstValueFrom(http.get(environment.session.token));
    httpMock.expectOne(environment.session.token).flush('no', unauthorized);
    await flush();

    await expectAsync(result).toBeRejected();
    expect(auth.renewAccessToken).not.toHaveBeenCalled();
    expect(recovery.recover).not.toHaveBeenCalled();
  });

  it('passes non-401 errors through untouched', async () => {
    const result = firstValueFrom(http.get('/api/x'));
    httpMock.expectOne('/api/x').flush('boom', { status: 500, statusText: 'Server Error' });
    await flush();

    await expectAsync(result).toBeRejected();
    expect(auth.renewAccessToken).not.toHaveBeenCalled();
  });
});
