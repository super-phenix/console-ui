import { Injectable } from '@angular/core';
import { ProductSnapshot } from '../models/product.model';
import { CreateSnapshot, UpdateSnapshot } from '../models/storage/snapshot/create-snapshot.model';
import { BaseService } from './base.service';
import { productOnceHandler } from '@shared/http/customHandler';

@Injectable({
  providedIn: 'root',
})
export class SnapshotService extends BaseService<ProductSnapshot, CreateSnapshot> {
  override ENDPOINT = '/snapshot';

  update(orgaId: string, projectId: string, az: string, effectiveId: string, update: UpdateSnapshot) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`, update)
      .pipe(productOnceHandler(this.snackbar));
  }
}
