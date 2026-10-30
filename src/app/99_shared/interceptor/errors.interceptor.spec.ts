import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { DefaultModel } from '@shared/models/snackbar';
import { errorsInterceptor, IGNORE_ERROR_STATUSES, SKIP_ERROR_SNACKBAR } from './errors.interceptor';

const flush = () => new Promise<void>(resolve => setTimeout(resolve));

describe('errorsInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let snackbar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    snackbar = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        { provide: MatSnackBar, useValue: snackbar },
        provideHttpClient(withInterceptors([errorsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('shows a snackbar on generic HTTP error', async () => {
    const result = firstValueFrom(http.get('/api/test'));
    httpMock
      .expectOne('/api/test')
      .flush({ message: 'Something went wrong' }, { status: 500, statusText: 'Server Error' });
    await flush();

    await expectAsync(result).toBeRejected();
    expect(snackbar.open).toHaveBeenCalledWith('Something went wrong', DefaultModel.action, DefaultModel.config);
  });

  it('does not show a snackbar on 401 error', async () => {
    const result = firstValueFrom(http.get('/api/test'));
    httpMock.expectOne('/api/test').flush('unauthorized', { status: 401, statusText: 'Unauthorized' });
    await flush();

    await expectAsync(result).toBeRejected();
    expect(snackbar.open).not.toHaveBeenCalled();
  });

  it('does not show a snackbar when SKIP_ERROR_SNACKBAR is true', async () => {
    const context = new HttpContext().set(SKIP_ERROR_SNACKBAR, true);
    const result = firstValueFrom(http.get('/api/test', { context }));
    httpMock.expectOne('/api/test').flush('error', { status: 500, statusText: 'Server Error' });
    await flush();

    await expectAsync(result).toBeRejected();
    expect(snackbar.open).not.toHaveBeenCalled();
  });

  it('does not show a snackbar when status is in IGNORE_ERROR_STATUSES', async () => {
    const context = new HttpContext().set(IGNORE_ERROR_STATUSES, [403]);
    const result = firstValueFrom(http.get('/api/test', { context }));
    httpMock.expectOne('/api/test').flush('forbidden', { status: 403, statusText: 'Forbidden' });
    await flush();

    await expectAsync(result).toBeRejected();
    expect(snackbar.open).not.toHaveBeenCalled();
  });
});
