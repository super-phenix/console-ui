import { Injectable } from '@angular/core';
import { ProductDisk } from '../models/product.model';
import { CreateDisk, UpdateDisk } from '../models/storage/disk/create-disk.model';
import { BaseService } from './base.service';
import { productOnceHandler } from '@shared/http/customHandler';

@Injectable({
  providedIn: 'root',
})
export class DiskService extends BaseService<ProductDisk, CreateDisk> {
  override ENDPOINT = '/disk';

  /**
   * List storage class for an AZ
   * @param orgaId
   * @param projectId
   * @param az
   * @returns
   */
  listStorageClass(orgaId: string, projectId: string, az: string) {
    return this.http
      .get<string[]>(`${this.getBasePath(orgaId, projectId, az)}/storage-class`)
      .pipe(productOnceHandler(this.snackbar));
  }

  /**
   * Unmount disk from the instance
   * @param orgaId
   * @param projectId
   * @param az
   * @param effectiveId EID of the disk to unmount
   * @returns
   */
  unmountDisk(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/unmount`)
      .pipe(productOnceHandler(this.snackbar));
  }

  update(orgaId: string, projectId: string, az: string, effectiveId: string, update: UpdateDisk) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`, update)
      .pipe(productOnceHandler(this.snackbar));
  }
}
