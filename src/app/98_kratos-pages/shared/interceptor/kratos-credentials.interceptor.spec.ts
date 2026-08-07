import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { kratosCredentialsInterceptor } from './kratos-credentials.interceptor';

describe('kratosCredentialsInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([kratosCredentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should add withCredentials to requests targeting authUrl', async () => {
    const url = `${environment.authUrl}/self-service/login/browser`;
    const p = firstValueFrom(http.get(url));

    const req = httpMock.expectOne(url);
    expect(req.request.withCredentials).toBeTrue();
    req.flush({});
    await p;
  });

  it('should not add withCredentials to other requests', async () => {
    const url = 'https://other-api.example.com/data';
    const p = firstValueFrom(http.get(url));

    const req = httpMock.expectOne(url);
    expect(req.request.withCredentials).toBeFalse();
    req.flush({});
    await p;
  });
});
