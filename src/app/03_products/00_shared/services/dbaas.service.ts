import { Injectable } from '@angular/core';
import { productOnceHandler } from '@shared/http/customHandler';
import { BaseService } from './base.service';
import { ProductDBaaS } from '../models/product.model';
import { CreateDBaaS, DBaaSCredentials, UpdateDBaaS, UpdateDBaaSProduct } from '../models/paas/dbaas/dbaas.model';

@Injectable({
  providedIn: 'root',
})
export class DBaaSService extends BaseService<ProductDBaaS, CreateDBaaS> {
  override ENDPOINT = '/dbaas';

  getPostgresVersions(orgaId: string, projectId: string) {
    return this.http
      .get<string[]>(`${this.getPath(orgaId, projectId)}/postgres-versions`)
      .pipe(productOnceHandler(this.snackbar));
  }

  getForUpdate(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get<UpdateDBaaSProduct>(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/app`)
      .pipe(productOnceHandler(this.snackbar));
  }

  update(orgaId: string, projectId: string, az: string, effectiveId: string, update: UpdateDBaaS) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`, update)
      .pipe(productOnceHandler(this.snackbar));
  }

  restart(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/restart`, {})
      .pipe(productOnceHandler(this.snackbar));
  }

  /**
   * Get the database owner credentials and endpoints
   * @param orgaId
   * @param projectId
   * @param az
   * @param effectiveId EID of the database
   * @returns
   */
  getCredentials(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get<DBaaSCredentials>(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/credentials`)
      .pipe(productOnceHandler(this.snackbar));
  }
}
