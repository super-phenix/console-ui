import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ENDPOINT, HTTP_PROTOCOL, environment } from '@env/environment';
import { defaultOnceHandler } from '@shared/http/customHandler';
import { Observable } from 'rxjs';
import { AZ } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class AZService {
  http = inject(HttpClient);

  listAZs(orgId: string): Observable<AZ[]> {
    return this.http.get<AZ[]>(this.getBaseUrl(orgId) + '/az-list').pipe(defaultOnceHandler());
  }

  static getLogoUrl(azCode: string | undefined, azList: AZ[]): string {
    return azList.find(az => az.code === azCode)?.logoUrl ?? '';
  }

  private getBaseUrl(orgId: string) {
    return `${HTTP_PROTOCOL}${environment.apiUrl}${API_ENDPOINT}/organization/${orgId}`;
  }
}
