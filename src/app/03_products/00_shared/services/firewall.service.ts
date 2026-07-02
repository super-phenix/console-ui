import { Injectable } from '@angular/core';
import { productOnceHandler } from '@shared/http/customHandler';
import { ProductFirewall } from '../models/product.model';
import { BaseService } from './base.service';
import { CreateFirewall, UpdateFirewall } from '../models/network/firewall/create-firewall.model';

@Injectable({
  providedIn: 'root',
})
export class FirewallService extends BaseService<ProductFirewall, CreateFirewall> {
  override ENDPOINT = '/firewall';

  update(orgaId: string, projectId: string, az: string, effectiveId: string, update: UpdateFirewall) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`, update)
      .pipe(productOnceHandler(this.snackbar));
  }
}
