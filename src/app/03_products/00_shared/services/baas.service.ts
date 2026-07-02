import { Injectable } from '@angular/core';
import { productOnceHandler } from '@shared/http/customHandler';
import { BaseService } from './base.service';
import { ProductBaaS } from '../models/product.model';
import { CreateBaaS, UpdateBaaS, UpdateBaaSProduct } from '../models/storage/baas/baas';

@Injectable({
  providedIn: 'root',
})
export class BaasService extends BaseService<ProductBaaS, CreateBaaS> {
  override ENDPOINT = '/baas';

  getForUpdate(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get<UpdateBaaSProduct>(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/app`)
      .pipe(productOnceHandler(this.snackbar));
  }

  update(orgaId: string, projectId: string, az: string, effectiveId: string, update: UpdateBaaS) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`, update)
      .pipe(productOnceHandler(this.snackbar));
  }
}
