import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink } from '@angular/router';
import { ContainerDisk } from '@products/00_shared/models/compute/instance/container-disk';
import { BUS_AUTO } from '@products/00_shared/models/compute/instance/instance';
import { CDRomBus, DiskBus } from '@products/00_shared/models/compute/instance/vmi.model';
import { ProductDisk, ProductInstance } from '@products/00_shared/models/product.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom, forkJoin, Observable, of } from 'rxjs';
import { ManageContainerDisksDialog } from './dialogs/mount-container-disk-dialog.component';

interface CloudInit {
  cloudInitData?: string;
  legacy?: boolean;
  bus: string;
}

interface DiskObject {
  volumeId?: string;
  volumeName: string;
  disk?: DiskBus;
  cdrom?: CDRomBus;
}

@Component({
  selector: 'spx-instance-details-storage',
  imports: [
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    RouterLink,
    MatTableModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    BannerComponent,
    GridDirective,
  ],
  templateUrl: './instance-details-storage.component.html',
  styleUrl: './instance-details-storage.component.scss',
})
export class InstanceDetailsStorageComponent {
  protected instanceSvc = inject(InstanceService);
  protected diskSvc = inject(DiskService);
  protected permissionSvc = inject(PermissionService);
  protected stateSvc = inject(StateService);
  protected router = inject(Router);
  protected dialog = inject(MatDialog);
  protected BannerLevelEnum = BannerLevelEnum;

  displayedColumns: string[] = ['id', 'name', 'type', 'mountType', 'size', 'progress', 'actions'];

  az = input.required<string>();
  instance = input.required<ProductInstance>();
  dataChanged = output();

  cloudInit = signal<CloudInit | undefined>(undefined);
  instanceVolumes = signal<DiskObject[]>([]);

  disksProduct;
  containerDisksCatalog;

  vmPreference = computed(() => this.instance().vm?.spec?.preference?.name || '');

  availableContainerDisks = computed<ContainerDisk[]>(() => {
    const catalog = this.containerDisksCatalog.hasValue() ? (this.containerDisksCatalog.value() ?? []) : [];
    const pref = this.vmPreference();
    return catalog.filter(c => c.supportedOS.some(os => pref.includes(os)));
  });

  mountedContainerDisks = computed<string[]>(() => this.instance().containerDisks ?? []);

  unmountedContainerDisks = computed<ContainerDisk[]>(() => {
    const mounted = this.mountedContainerDisks();
    return this.availableContainerDisks().filter(c => !mounted.includes(c.id));
  });

  dataSource = computed(() => {
    const products = this.disksProduct.hasValue() ? this.disksProduct.value()! : [];

    const datas: {
      type: string;
      bus: string;
      name: string;
      product?: ProductDisk;
      containerDisk?: ContainerDisk;
      containerDiskMounted?: boolean;
    }[] = [];
    this.instanceVolumes().forEach(diskEl => {
      const product = products.find(v => v.eid === diskEl.volumeId);
      if (product) {
        datas.push({
          type: diskEl.cdrom?.bus ? 'CD-ROM' : 'Disk',
          bus: diskEl.disk?.bus || BUS_AUTO,
          name: product.productName,
          product: product,
        });
      } else {
        datas.push({
          type: 'Driver',
          bus: diskEl.disk?.bus || BUS_AUTO,
          name: diskEl.volumeName,
        });
      }
    });

    const mounted = this.mountedContainerDisks();
    this.availableContainerDisks()
      .filter(catalog => mounted.includes(catalog.id))
      .forEach(catalog => {
        datas.push({
          type: 'Container Disk',
          bus: catalog.bus,
          name: catalog.displayName,
          containerDisk: catalog,
          containerDiskMounted: true,
        });
      });

    const dataSource = new MatTableDataSource(datas);
    return dataSource;
  });

  showUserData = false;

  canProjectInstanceWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceWrite)
  );

  instanceStatus = computed(() => {
    if (this.instance()) {
      const instance = this.instance();
      const status =
        (instance.vmi && instance.vmi?.status?.phase
          ? instance.vmi!.status.phase
          : instance.vm?.status?.printableStatus) || 'unknown';
      return status;
    } else {
      return 'unknown';
    }
  });

  constructor() {
    const diskSvc = this.diskSvc;
    const instanceSvc = this.instanceSvc;

    effect(() => {
      this.loadDisks(this.instance());
    });

    this.disksProduct = rxResource({
      params: () => this.instanceVolumes(),
      stream: ({ params }) => {
        const obs: Observable<ProductDisk>[] = [];

        if (params.length > 0) {
          params.forEach(v => {
            if (v.volumeId) {
              obs.push(
                diskSvc.get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az(), v.volumeId)
              );
            }
          });
          return forkJoin(obs);
        } else {
          return of([]);
        }
      },
      defaultValue: [],
    });

    this.containerDisksCatalog = rxResource<ContainerDisk[], string>({
      params: () => this.az(),
      stream: () => {
        if (this.az() && this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
          return instanceSvc.listContainerDisks(
            this.stateSvc.organization()!.id,
            this.stateSvc.project()!.id,
            this.az()
          );
        }
        return of<ContainerDisk[]>([]);
      },
      defaultValue: [],
    });
  }

  loadDisks(instance: ProductInstance) {
    if (instance) {
      const volumes = instance.vmi?.spec?.volumes
        ? instance.vmi!.spec.volumes
        : instance.vm?.spec?.template?.spec?.volumes;

      const diskDevices = instance.vmi?.spec?.domain?.devices?.disks
        ? instance.vmi!.spec!.domain!.devices?.disks
        : instance.vm?.spec?.template?.spec?.domain?.devices.disks;

      const diskElements: DiskObject[] = [];
      if (volumes && diskDevices) {
        volumes.forEach(volume => {
          const disk = diskDevices.find(v => v.name === volume.name);

          // Container-disk volumes (e.g. virtio-windows) are rendered from the catalog join
          if (volume.containerDisk) {
            return;
          }

          // Cloud init volumes
          if (volume.cloudInitNoCloud?.secretRef?.name || volume.cloudInitConfigDrive?.secretRef?.name) {
            this.cloudInit.set({
              cloudInitData: instance.cloudInit,
              bus: disk?.disk?.bus || BUS_AUTO,
            });
          } else if (volume?.cloudInitNoCloud?.userData || volume?.cloudInitNoCloud?.userDataBase64) {
            // Check for legacy cloud init volume
            this.cloudInit.set({
              cloudInitData: volume?.cloudInitNoCloud?.userData || volume?.cloudInitNoCloud?.userDataBase64,
              bus: disk?.disk?.bus || BUS_AUTO,
              legacy: true,
            });
          } else if (volume.dataVolume?.name || volume.persistentVolumeClaim?.claimName) {
            const eid = volume.dataVolume?.name || volume.persistentVolumeClaim?.claimName;
            // Data Disk volume (PVC or Datavolume)
            diskElements.push({
              volumeId: eid!,
              volumeName: volume.name,
              cdrom: disk?.cdrom,
              disk: disk?.disk,
            });
          } else {
            diskElements.push({
              volumeName: volume.name,
              cdrom: disk?.cdrom,
              disk: disk?.disk,
            });
          }
        });
      }

      this.instanceVolumes.set(diskElements);
    }
  }

  async unmount(diskEID: string, productName?: string) {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Unmount a disk',
        html: `
              <span>Are you sure you want to unmount "${productName || diskEID}" ?</span>
              <br><br>
              <span><strong>Warning: </strong><i>The change will only take effect after the instance has been restarted.</i></span>`,
      },
    });
    ref.afterClosed().subscribe(async res => {
      if (res === true) {
        await firstValueFrom(
          this.diskSvc.unmountDisk(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az(), diskEID)
        );
        this.dataChanged.emit();
      }
    });
  }

  openManageContainerDisksDialog() {
    const disks = this.availableContainerDisks();
    const mountedTypes = this.mountedContainerDisks();
    const ref = this.dialog.open(ManageContainerDisksDialog, {
      data: { disks, mountedTypes },
    });
    ref.afterClosed().subscribe(async (selected: string[] | undefined) => {
      if (!selected) return;
      const initial = new Set(mountedTypes);
      const final = new Set(selected);
      const toMount = [...final].filter(t => !initial.has(t));
      const toUnmount = [...initial].filter(t => !final.has(t));
      if (toMount.length === 0 && toUnmount.length === 0) return;

      const orgaId = this.stateSvc.organization()!.id;
      const projectId = this.stateSvc.project()!.id;
      const az = this.az();
      const eid = this.instance().eid;

      // Fire unmount and mount as two sequential batched calls. Each batch is
      // atomic on the controller; running them in parallel would re-create
      // the optimistic-concurrency race against the VM resource that the
      // batched endpoint was introduced to fix.
      if (toUnmount.length > 0) {
        await firstValueFrom(this.instanceSvc.unmountContainerDisks(orgaId, projectId, az, eid, toUnmount));
      }
      if (toMount.length > 0) {
        await firstValueFrom(this.instanceSvc.mountContainerDisks(orgaId, projectId, az, eid, toMount));
      }
      this.dataChanged.emit();
    });
  }

  async unmountContainerDisk(disk: ContainerDisk) {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title: `Unmount ${disk.displayName}`,
        html: `
              <span>Are you sure you want to unmount "${disk.displayName}" from this instance?</span>
              <br><br>
              <span><strong>Warning: </strong><i>The change will only take effect after the instance has been restarted.</i></span>`,
      },
    });
    ref.afterClosed().subscribe(async res => {
      if (res === true) {
        await firstValueFrom(
          this.instanceSvc.unmountContainerDisks(
            this.stateSvc.organization()!.id,
            this.stateSvc.project()!.id,
            this.az(),
            this.instance().eid,
            [disk.id]
          )
        );
        this.dataChanged.emit();
      }
    });
  }
}
