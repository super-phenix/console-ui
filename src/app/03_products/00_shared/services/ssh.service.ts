import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { CreateSSH } from '../models/uncategorized/ssh/create-ssh.model';
import { ProductSSH } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class SshService extends BaseService<ProductSSH, CreateSSH> {
  override ENDPOINT = '/ssh';
}
