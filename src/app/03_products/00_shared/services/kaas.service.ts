import { Injectable } from '@angular/core';
import { productOnceHandler } from '@shared/http/customHandler';
import { BaseService } from './base.service';
import { ProductFirewall, ProductInstance, ProductKaaS } from '../models/product.model';
import { CreateKaaS, UpdateKaaS, UpdateKaaSProduct } from '../models/paas/kaas/kaas';

@Injectable({
  providedIn: 'root',
})
export class KaasService extends BaseService<ProductKaaS, CreateKaaS> {
  override ENDPOINT = '/kaas';

  getForUpdate(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get<UpdateKaaSProduct>(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/app`)
      .pipe(productOnceHandler(this.snackbar));
  }

  update(orgaId: string, projectId: string, az: string, effectiveId: string, update: UpdateKaaS) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`, update)
      .pipe(productOnceHandler(this.snackbar));
  }

  listInstances(orgaId: string, projectId: string, az: string, clusterEid: string) {
    return this.http
      .get<ProductInstance[]>(`${this.getPath(orgaId, projectId, az)}/${clusterEid}/instances`)
      .pipe(productOnceHandler(this.snackbar));
  }

  listNetpols(orgaId: string, projectId: string, az: string, clusterEid: string) {
    return this.http
      .get<ProductFirewall[]>(`${this.getPath(orgaId, projectId, az)}/${clusterEid}/netpols`)
      .pipe(productOnceHandler(this.snackbar));
  }

  getKubeVersions(orgaId: string, projectId: string) {
    return this.http
      .get<string[]>(`${this.getPath(orgaId, projectId)}/kube-versions`)
      .pipe(productOnceHandler(this.snackbar));
  }

  getKubeconfig(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/kubeconfig`, {
        responseType: 'arraybuffer',
      })
      .pipe(productOnceHandler(this.snackbar));
  }

  reinstallEssentials(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/reinstall-essentials`)
      .pipe(productOnceHandler(this.snackbar));
  }
}
