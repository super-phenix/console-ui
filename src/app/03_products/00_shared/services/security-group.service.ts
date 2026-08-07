import { Injectable } from '@angular/core';
import { productOnceHandler } from '@shared/http/customHandler';
import { ProductSecurityGroup } from '../models/product.model';
import { BaseService } from './base.service';
import { CreateSecurityGroup, UpdateSecurityGroup } from '../models/network/security-group/create-security-group.model';

@Injectable({
  providedIn: 'root',
})
export class SecurityGroupService extends BaseService<ProductSecurityGroup, CreateSecurityGroup> {
  override ENDPOINT = '/security-group';

  update(orgaId: string, projectId: string, az: string, effectiveId: string, update: UpdateSecurityGroup) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`, update)
      .pipe(productOnceHandler(this.snackbar));
  }
}
