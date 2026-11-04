import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ENDPOINT, HTTP_PROTOCOL, environment } from '@env/environment';
import { defaultOnceHandler } from '@shared/http/customHandler';
import { SKIP_ERROR_SNACKBAR } from '@shared/interceptor/errors.interceptor';
import { Observable } from 'rxjs';
import { AZ, AzDefaultCloudInit } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class AZService {
  http = inject(HttpClient);

  listAZs(orgId: string): Observable<AZ[]> {
    return this.http.get<AZ[]>(this.getBaseUrl(orgId) + '/az-list').pipe(defaultOnceHandler());
  }

  getDefaultCloudInit(orgId: string, az: string): Observable<AzDefaultCloudInit> {
    return this.http
      .get<AzDefaultCloudInit>(`${this.getBaseUrl(orgId)}/az/${az}/default-cloud-init`, {
        context: new HttpContext().set(SKIP_ERROR_SNACKBAR, true),
      })
      .pipe(defaultOnceHandler());
  }

  static getLogoUrl(azCode: string | undefined, azList: AZ[]): string {
    return azList.find(az => az.code === azCode)?.logoUrl ?? '';
  }

  private getBaseUrl(orgId: string) {
    return `${HTTP_PROTOCOL}${environment.apiUrl}${API_ENDPOINT}/organization/${orgId}`;
  }
}
