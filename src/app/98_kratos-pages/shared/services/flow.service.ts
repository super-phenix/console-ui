import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { FlowTypeEnum } from '@kratos-pages/shared/models/common';
import { environment } from '@env/environment';
import { FlowError, Session } from '@ory/client';
import { take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FlowService {
  private base: string = environment.authUrl;
  protected http = inject(HttpClient);

  private removeTrailingSlash = (s: string) => s.replace(/\/$/, '');
  private getUrlForFlow = (flow: string, type: 'browser' | 'flows', query?: URLSearchParams) =>
    `${this.removeTrailingSlash(this.base)}/self-service/${flow}/${type}${query ? `?${query.toString()}` : ''}`;

  getFlowError(id: string) {
    return this.http
      .get<FlowError>(`${this.removeTrailingSlash(this.base)}/self-service/errors?id=${id}`)
      .pipe(take(1));
  }

  initFlow<T>(flow: FlowTypeEnum, query?: URLSearchParams) {
    return this.http.get<T>(this.getUrlForFlow(flow, 'browser', query)).pipe(take(1));
  }

  getFlow<T>(flow: FlowTypeEnum, flowId: string) {
    return this.http
      .get<T>(
        this.getUrlForFlow(
          flow,
          'flows',
          new URLSearchParams({
            id: flowId,
          })
        )
      )
      .pipe(take(1));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendForm(url: string, body: any) {
    return this.http.post<Session>(url, body, {
      headers: { Accept: 'application/json' },
    });
  }
}
