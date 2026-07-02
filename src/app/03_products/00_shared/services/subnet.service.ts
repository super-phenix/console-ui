import { Injectable } from '@angular/core';
import { CreateSubnet, UpdateSubnet } from '../models/network/subnet/create-subnet.model';
import { ProductSubnet } from '../models/product.model';
import { BaseService } from './base.service';
import { productOnceHandler } from '@shared/http/customHandler';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root',
})
export class SubnetService extends BaseService<ProductSubnet, CreateSubnet> {
  override ENDPOINT = '/subnet';

  update(orgaId: string, projectId: string, az: string, effectiveId: string, update: UpdateSubnet) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`, update)
      .pipe(productOnceHandler(this.snackbar));
  }

  hasEIP(orgaId: string, projectId: string, az: string, effectiveId: string): Observable<{ hasEIP: boolean }> {
    return this.http
      .get<{ hasEIP: boolean }>(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/has-eip`)
      .pipe(productOnceHandler(this.snackbar));
  }
}
