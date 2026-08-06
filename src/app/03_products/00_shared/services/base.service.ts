import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CONTROLLER_PATH, HTTP_PROTOCOL, environment } from '@env/environment';
import { productOnceHandler } from '@shared/http/customHandler';
import { ArgoCdLink, Product, ProductCreation } from '../models/product.model';

/**
 * Base Service for contacting API
 * Define list, get, create, delete
 *
 * T extends Product, define the Product type
 * K, defined the Product Create type
 */
@Injectable({
  providedIn: 'root',
})
export abstract class BaseService<T extends Product, K> {
  protected http = inject(HttpClient);
  protected snackbar = inject(MatSnackBar);
  protected abstract ENDPOINT: string;

  list(orgaId: string, projectId: string) {
    return this.http.get<T[]>(`${this.getPath(orgaId, projectId)}`).pipe(productOnceHandler(this.snackbar));
  }

  listByAZ(orgaId: string, projectId: string, az: string) {
    return this.http.get<T[]>(`${this.getPath(orgaId, projectId, az)}`).pipe(productOnceHandler(this.snackbar));
  }

  /**
   * Get Product with Effective ID
   * @param orgId
   * @param projectId
   * @param az Code AZ
   * @param effectiveId Effective Id
   * @returns
   */
  get(orgId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get<T>(`${this.getPath(orgId, projectId, az)}/${effectiveId}`)
      .pipe(productOnceHandler(this.snackbar));
  }

  /**
   * Get Product with Local ID
   * @param orgId
   * @param projectId
   * @param az
   * @param localId
   * @returns
   */
  getByLocalId(orgId: string, projectId: string, az: string, localId: string) {
    return this.http
      .get<T>(`${this.getPath(orgId, projectId, az)}/localId/${localId}`)
      .pipe(productOnceHandler(this.snackbar));
  }

  create(orgaId: string, projectId: string, az: string, create: K) {
    return this.http
      .post<ProductCreation>(`${this.getPath(orgaId, projectId, az)}`, create)
      .pipe(productOnceHandler(this.snackbar));
  }

  delete(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .delete(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`)
      .pipe(productOnceHandler(this.snackbar));
  }

  /**
   * Get Product with Effective ID
   * @param orgId
   * @param projectId
   * @param az Code AZ
   * @param effectiveId Effective Id
   * @returns
   */
  getArgoLink(orgId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get<ArgoCdLink>(`${this.getBasePath(orgId, projectId, az)}/argo-link${this.ENDPOINT}/${effectiveId}`)
      .pipe(productOnceHandler(this.snackbar));
  }

  /**
   * Build the base url for controller endpoint
   * @param orgId
   * @param projectId
   * @param az Code AZ
   * @returns
   */
  protected getPath(orgId: string, projectId: string, az?: string): string {
    const end = az ? `${az}/${projectId}` : `${projectId}`;
    return `${HTTP_PROTOCOL}${environment.apiUrl}/${orgId}${CONTROLLER_PATH}/${end}${this.ENDPOINT}`;
  }

  /**
   * Build the base url for controller endpoint without specific endpoint
   * @param orgId
   * @param projectId
   * @param az Code AZ
   * @returns
   */
  protected getBasePath(orgId: string, projectId: string, az?: string): string {
    const end = az ? `${az}/${projectId}` : `${projectId}`;
    return `${HTTP_PROTOCOL}${environment.apiUrl}/${orgId}${CONTROLLER_PATH}/${end}`;
  }
}
