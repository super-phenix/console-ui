import { Injectable } from '@angular/core';
import { CreateEIP, UpdateEIP } from '../models/network/eip/create-eip.model';
import { ProductEIP } from '../models/product.model';
import { BaseService } from './base.service';
import { productOnceHandler } from '@shared/http/customHandler';

@Injectable({
  providedIn: 'root',
})
export class EipService extends BaseService<ProductEIP, CreateEIP> {
  override ENDPOINT = '/eip';

  update(orgaId: string, projectId: string, az: string, effectiveId: string, update: UpdateEIP) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`, update)
      .pipe(productOnceHandler(this.snackbar));
  }
}
