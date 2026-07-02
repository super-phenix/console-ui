import { Injectable } from '@angular/core';
import { CreateVPC, UpdateVPC } from '../models/network/vpc/create-vpc.model';
import { ProductVPC } from '../models/product.model';
import { BaseService } from './base.service';
import { productOnceHandler } from '@shared/http/customHandler';

@Injectable({
  providedIn: 'root',
})
export class VPCService extends BaseService<ProductVPC, CreateVPC> {
  override ENDPOINT = '/vpc';

  update(orgaId: string, projectId: string, az: string, effectiveId: string, update: UpdateVPC) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`, update)
      .pipe(productOnceHandler(this.snackbar));
  }
}
