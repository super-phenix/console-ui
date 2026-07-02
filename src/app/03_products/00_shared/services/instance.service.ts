import { Injectable } from '@angular/core';
import { AdvancedOptions } from '../models/compute/instance/advanced-options.model';
import { ContainerDisk } from '../models/compute/instance/container-disk';
import { CreateInstance, UpdateInstance } from '../models/compute/instance/instance';
import { VirtualMachinePreferenceView } from '../models/compute/instance/vm-preference.model';
import { ProductInstance } from '../models/product.model';
import { BaseService } from './base.service';
import { productOnceHandler } from '@shared/http/customHandler';

@Injectable({
  providedIn: 'root',
})
export class InstanceService extends BaseService<ProductInstance, CreateInstance> {
  override ENDPOINT = '/instance';

  /**
   * List instance class for an AZ
   * @param orgaId
   * @param projectId
   * @param az
   * @returns
   */
  listInstanceType(orgaId: string, projectId: string, az: string) {
    return this.http
      .get<string[]>(`${this.getBasePath(orgaId, projectId, az)}/vm-type`)
      .pipe(productOnceHandler(this.snackbar));
  }

  /**
   * Fetch the full settings of an instance type by name.
   * Returns the KubeVirt VM preference view (route stays `/vm-type`, the
   * backend/KubeVirt term for the same resource).
   */
  getInstanceType(orgaId: string, projectId: string, az: string, name: string) {
    return this.http
      .get<VirtualMachinePreferenceView>(`${this.getBasePath(orgaId, projectId, az)}/vm-type/${name}`)
      .pipe(productOnceHandler(this.snackbar));
  }

  /**
   * Resolve an instance's effective advanced options (value + source).
   * Used by the details page and the update form.
   */
  getAdvancedOptions(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get<AdvancedOptions>(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/advanced-options`)
      .pipe(productOnceHandler(this.snackbar));
  }

  /**
   * Resolve the advanced options an instance type (vmType) would apply, without
   * an existing VM. Used by the create form to show instance type defaults.
   */
  getInstanceTypeAdvancedOptions(orgaId: string, projectId: string, az: string, name: string) {
    return this.http
      .get<AdvancedOptions>(`${this.getBasePath(orgaId, projectId, az)}/vm-type/${name}/advanced-options`)
      .pipe(productOnceHandler(this.snackbar));
  }

  update(orgaId: string, projectId: string, az: string, effectiveId: string, update: UpdateInstance) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}`, update)
      .pipe(productOnceHandler(this.snackbar));
  }

  startVM(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/start`)
      .pipe(productOnceHandler(this.snackbar));
  }

  stopVM(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/stop`)
      .pipe(productOnceHandler(this.snackbar));
  }

  stopForceVM(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/stop-force`)
      .pipe(productOnceHandler(this.snackbar));
  }

  restartVM(orgaId: string, projectId: string, az: string, effectiveId: string) {
    return this.http
      .get(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/restart`)
      .pipe(productOnceHandler(this.snackbar));
  }

  /**
   * List the platform's catalog of container-disks available for this AZ.
   * The catalog is the source of truth for which types can be mounted and
   * the OS preferences they apply to.
   */
  listContainerDisks(orgaId: string, projectId: string, az: string) {
    return this.http
      .get<ContainerDisk[]>(`${this.getBasePath(orgaId, projectId, az)}/container-disks`)
      .pipe(productOnceHandler(this.snackbar));
  }

  mountContainerDisks(orgaId: string, projectId: string, az: string, effectiveId: string, types: string[]) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/container-disk/mount`, { ids: types })
      .pipe(productOnceHandler(this.snackbar));
  }

  unmountContainerDisks(orgaId: string, projectId: string, az: string, effectiveId: string, types: string[]) {
    return this.http
      .post(`${this.getPath(orgaId, projectId, az)}/${effectiveId}/container-disk/unmount`, { ids: types })
      .pipe(productOnceHandler(this.snackbar));
  }
}
