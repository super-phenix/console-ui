import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ENDPOINT, HTTP_PROTOCOL, environment } from '@env/environment';
import { Observable, map } from 'rxjs';
import { defaultOnceHandler } from '../http/customHandler';

export interface ApiToken {
  id: string;
  name: string;
  prefix: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreateApiTokenBody {
  name: string;
  expiresAt?: string;
}

export interface CreateApiTokenResponse {
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiTokenService {
  protected http = inject(HttpClient);

  private getBaseUrl() {
    return `${HTTP_PROTOCOL}${environment.apiUrl}${API_ENDPOINT}/api-token`;
  }

  list(): Observable<ApiToken[]> {
    return this.http.get<ApiToken[]>(this.getBaseUrl()).pipe(
      defaultOnceHandler(),
      map(tokens =>
        tokens.map(t => ({
          ...t,
          createdAt: new Date(t.createdAt),
          expiresAt: new Date(t.expiresAt),
        }))
      )
    );
  }

  create(body: CreateApiTokenBody): Observable<CreateApiTokenResponse> {
    return this.http.post<CreateApiTokenResponse>(this.getBaseUrl(), body).pipe(defaultOnceHandler());
  }

  revoke(id: string): Observable<void> {
    return this.http.delete<void>(`${this.getBaseUrl()}/${id}`).pipe(defaultOnceHandler());
  }
}
