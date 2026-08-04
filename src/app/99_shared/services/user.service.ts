import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ENDPOINT, HTTP_PROTOCOL, environment } from '@env/environment';
import { Observable } from 'rxjs';
import { defaultOnceHandler } from '../http/customHandler';

export interface RegenerateInviteCodeResponse {
  inviteCode: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  protected http = inject(HttpClient);

  private getBaseUrl() {
    return `${HTTP_PROTOCOL}${environment.apiUrl}${API_ENDPOINT}`;
  }

  resetInviteCode(): Observable<RegenerateInviteCodeResponse> {
    return this.http
      .post<RegenerateInviteCodeResponse>(`${this.getBaseUrl()}/invite-code`, {})
      .pipe(defaultOnceHandler());
  }
}
