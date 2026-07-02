import { Injectable } from '@angular/core';
import { productOnceHandler } from '@shared/http/customHandler';
import { ProductLoadBalancer } from '../models/product.model';
import { BaseService } from './base.service';
import { CreateLoadBalancer, UpdateLoadBalancer } from '../models/network/load-balancer/create-load-balancer.model';

@Injectable({
  providedIn: 'root',
})
export class LoadBalancerService extends BaseService<ProductLoadBalancer, CreateLoadBalancer> {
  override ENDPOINT = '/load-balancer';

  update(orgaId: string, projectId: string, az: string, effectiveId: string, update: UpdateLoadBalancer) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`, update)
      .pipe(productOnceHandler(this.snackbar));
  }
}
