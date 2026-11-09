import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { CreateSSH } from '../models/uncategorized/ssh/create-ssh.model';
import { ProductSSH } from '../models/product.model';
import { SSHUser } from '../models/uncategorized/ssh/ssh.model';
import { productOnceHandler } from '@shared/http/customHandler';

@Injectable({
  providedIn: 'root',
})
export class SshService extends BaseService<ProductSSH, CreateSSH> {
  override ENDPOINT = '/ssh';

  /** List the instances using an SSH key. Requires ProjectInstanceRead. */
  getUsage(orgId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get<SSHUser[]>(`${this.getPath(orgId, projectId, az)}/${effectiveId}/usage`)
      .pipe(productOnceHandler(this.snackbar));
  }
}
