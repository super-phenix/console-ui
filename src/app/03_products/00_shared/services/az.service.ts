import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
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
    return `${environment.url.http}${environment.api.organization}/${orgId}`;
  }
}
