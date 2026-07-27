import { Injectable } from '@angular/core';
import { ProductBucket } from '../models/product.model';
import { BucketCredentials, S3Config } from '../models/storage/bucket/bucket.model';
import { CreateBucket, UpdateBucket } from '../models/storage/bucket/create-bucket.model';
import { BaseService } from './base.service';
import { productOnceHandler } from '@shared/http/customHandler';

@Injectable({
  providedIn: 'root',
})
export class BucketService extends BaseService<ProductBucket, CreateBucket> {
  override ENDPOINT = '/bucket';

  /**
   * Get the S3 configuration of an AZ (storage classes and bucket limits)
   * @param orgaId
   * @param projectId
   * @param az
   * @returns
   */
  getS3Config(orgaId: string, projectId: string, az: string) {
    return this.http
      .get<S3Config>(`${this.getBasePath(orgaId, projectId, az)}/s3-config`)
      .pipe(productOnceHandler(this.snackbar));
  }

  update(orgaId: string, projectId: string, az: string, effectiveId: string, update: UpdateBucket) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`, update)
      .pipe(productOnceHandler(this.snackbar));
  }

  /**
   * Get the S3 endpoint and admin credentials generated for a bucket
   * @param orgaId
   * @param projectId
   * @param az
   * @param effectiveId EID of the bucket
   * @returns
   */
  getCredentials(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get<BucketCredentials>(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/credentials`)
      .pipe(productOnceHandler(this.snackbar));
  }
}
