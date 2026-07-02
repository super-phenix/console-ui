import { Injectable } from '@angular/core';
import { ProductInstanceSnapshot } from '../models/product.model';
import { CreateInstanceSnapshot } from '../models/compute/instance-snapshot/create-instance-snapshot.model';
import { BaseService } from './base.service';
import { productOnceHandler } from '@shared/http/customHandler';

@Injectable({
  providedIn: 'root',
})
export class InstanceSnapshotService extends BaseService<ProductInstanceSnapshot, CreateInstanceSnapshot> {
  override ENDPOINT = '/instance-snapshot';

  restore(orgaId: string, projectId: string, az: string, effectiveId: string, name: string, localId: string) {
    return this.http
      .get(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/restore`, {
        params: {
          name,
          localId,
        },
      })
      .pipe(productOnceHandler(this.snackbar));
  }

  clone(orgaId: string, projectId: string, az: string, effectiveId: string, name: string) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/clone`, {
        name: name,
      })
      .pipe(productOnceHandler(this.snackbar));
  }
}
