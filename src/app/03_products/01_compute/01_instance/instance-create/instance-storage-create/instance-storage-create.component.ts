import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ContainerDiskCardComponent } from '@products/00_shared/components/container-disk-card/container-disk-card.component';
import { ContainerDisk } from '@products/00_shared/models/compute/instance/container-disk';
import {
  BUS_AUTO,
  BUS_LIST,
  CreateInstanceCloudInit,
  CreateInstanceDisk,
  DEFAULT_CLOUD_INIT,
} from '@products/00_shared/models/compute/instance/instance';
import { ProductDisk } from '@products/00_shared/models/product.model';
import { CreateDisk } from '@products/00_shared/models/storage/disk/create-disk.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { StateService } from '@shared/services/state.service';
import { distinctUntilChanged, firstValueFrom, map, of, startWith } from 'rxjs';
import { InstanceCreateDiskFormDialog } from '../dialogs/instance-create-disk-form-dialog.component';
import { TextEditorDialog } from '@products/00_shared/dialogs/text-editor-dialog.component';

interface DiskItem {
  cdrom: boolean;
  bus?: string;
  diskExisting?: ProductDisk;
  diskToCreate?: CreateDisk;
}

type ContainerDiskFilter = 'all' | 'mounted' | 'unmounted';

@Component({
  selector: 'spx-instance-storage-create',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    AsyncPipe,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    ContainerDiskCardComponent,
  ],
  templateUrl: './instance-storage-create.component.html',
  styleUrl: './instance-storage-create.component.scss',
})
export class InstanceStorageCreateComponent {
  protected fb = inject(FormBuilder);
  protected diskSvc = inject(DiskService);
  protected instanceSvc = inject(InstanceService);
  protected stateSvc = inject(StateService);

  private readonly dialog = inject(MatDialog);

  protected readonly BUS_LIST = BUS_LIST;
  protected readonly BUS_AUTO = BUS_AUTO;

  az = input.required<string | null>();
  vmName = input<string | null>();

  initDisks = input<CreateInstanceDisk[]>();
  limited = input<boolean>(false);

  initCloudInit = input<CreateInstanceCloudInit | undefined>(undefined);
  /**
   * VM preference name ("linux", "windows-server-2022", ...). Used to filter
   * the container-disk catalog to entries that support the current OS.
   */
  vmType = input<string | undefined>(undefined);
  /**
   * Initial set of mounted container-disk types loaded from the instance
   * being edited. Drives the checkbox-state seeding without re-emitting
   * containerDisksChange on load.
   */
  initContainerDisks = input<string[] | undefined>(undefined);
  /**
   * Emit a list of disks with an order
   */
  disksChange = output<CreateInstanceDisk[]>();
  isLoaded = output<boolean>();
  /**
   * Emit a custom cloud init
   */
  cloudInitChange = output<CreateInstanceCloudInit>();
  /**
   * Emit the desired set of mounted container-disk types whenever the user
   * toggles a checkbox. Order is not significant.
   */
  containerDisksChange = output<string[]>();

  cloudInitForm = this.fb.group({
    custom: this.fb.nonNullable.control(false, Validators.required),
    config: this.fb.nonNullable.control(DEFAULT_CLOUD_INIT, Validators.required),
    bus: this.fb.nonNullable.control<string>(BUS_AUTO),
  });

  // The list of disk selected by the user
  diskList: DiskItem[] = [];

  /**
   * Disk Input
   *
   * It's contains either a string (when the user is filtering values)
   * Or a ProductDisk when the user select a option in the autocomplete field
   */
  diskSelected = computed(() => {
    return new FormControl<ProductDisk | undefined>({
      value: undefined,
      disabled: this.az() === '' || this.az() == null,
    });
  });

  /**
   * List of all available product based on the current az value
   */
  disksProduct = rxResource({
    params: () => this.az(),
    stream: () => {
      if (this.az() !== '' && this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.diskSvc.listByAZ(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az()!);
      } else {
        return of([]);
      }
    },
  });

  /**
   * Platform catalog of container-disk types. The list is platform-static
   * — fetched once per AZ — and the per-VM applicability is computed
   * downstream by intersecting `supportedOS` with the current vmType.
   */
  containerDisksCatalog = rxResource<ContainerDisk[], string | null>({
    params: () => this.az(),
    stream: () => {
      if (this.az() && this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.instanceSvc.listContainerDisks(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.az()!
        );
      }
      return of<ContainerDisk[]>([]);
    },
    defaultValue: [],
  });

  availableContainerDisks = computed<ContainerDisk[]>(() => {
    const catalog = this.containerDisksCatalog.hasValue() ? (this.containerDisksCatalog.value() ?? []) : [];
    const pref = this.vmType() ?? '';
    if (!pref) {
      return [];
    }
    return catalog.filter(c => c.supportedOS.some(os => pref.includes(os)));
  });

  // Edit mode is detected by the presence of an initContainerDisks binding —
  // instance-update.component.html binds it, instance-create.component.html
  // does not. Drives the filter toggle visibility and the "Mounted" badge.
  isEditMode = computed(() => this.initContainerDisks() !== undefined);

  containerDiskFilter = signal<ContainerDiskFilter>('all');

  // Snapshot of types currently mounted on the VM. Stays stable as the user
  // toggles cards — mirrors the dialog's mountedSet semantics so "mounted"
  // always means "currently attached to the running instance."
  mountedContainerDiskTypes = computed<ReadonlySet<string>>(() => new Set(this.initContainerDisks() ?? []));

  visibleContainerDisks = computed<ContainerDisk[]>(() => {
    const available = this.availableContainerDisks();
    if (!this.isEditMode()) return available;
    const f = this.containerDiskFilter();
    if (f === 'all') return available;
    const mounted = this.mountedContainerDiskTypes();
    if (f === 'mounted') return available.filter(d => mounted.has(d.id));
    return available.filter(d => !mounted.has(d.id));
  });

  mountedContainerDiskCount = computed(
    () => this.availableContainerDisks().filter(d => this.mountedContainerDiskTypes().has(d.id)).length
  );

  unmountedContainerDiskCount = computed(
    () => this.availableContainerDisks().length - this.mountedContainerDiskCount()
  );

  /**
   * Per-type checked state for the catalog checkboxes. Initialized from
   * `initContainerDisks` (update mode) or from the recommended entries in
   * the catalog (create mode), and updated locally as the user toggles.
   * Must be a signal so the [checked] bindings re-evaluate when the
   * seeding effect updates the map — zoneless CD won't pick up a plain
   * field mutation.
   */
  containerDiskSelections = signal<Record<string, boolean>>({});

  /**
   * Observable containing the list of all disk matching with the filter input
   */
  filteredOptions = computed(() => {
    // Used to update filter when the product is loaded
    if (this.disksProduct.status() !== 'error') {
      this.disksProduct.value();
      return this.diskSelected().valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value || ''))
      );
    } else {
      return of([]);
    }
  });

  constructor() {
    // reset disk list on az change
    effect(() => {
      if (this.az() == null || this.az()) {
        this.diskList = [];
        this.updateOutput();
      }
    });

    // Seed checkbox state. Two modes share this effect:
    //   - update: parent passes initContainerDisks, we mirror them.
    //   - create: parent leaves initContainerDisks undefined; we pre-check
    //     entries flagged Recommended for the selected OS and emit them up
    //     so the CreateInstance payload carries the same defaults the
    //     backend would otherwise pick on its own.
    effect(() => {
      const available = this.availableContainerDisks();
      const init = this.initContainerDisks();
      const baseline = init ?? available.filter(c => c.recommended).map(c => c.id);

      const next: Record<string, boolean> = {};
      for (const cd of available) {
        next[cd.id] = baseline.includes(cd.id);
      }
      this.containerDiskSelections.set(next);

      // Only emit on the create path. On update the parent already has the
      // init values and we'd just round-trip them; on create the parent has
      // no other source for these defaults.
      if (init === undefined && available.length > 0) {
        this.containerDisksChange.emit(Object.keys(next).filter(t => next[t]));
      }
    });

    // update disk list when initDisk is loaded
    effect(() => {
      if (this.initDisks() && this.disksProduct.status() != 'error') {
        const diskList: DiskItem[] = [];
        this.initDisks()!.forEach(disk => {
          const product = this.disksProduct.value()?.find(v => v.eid === disk.eid);
          if (product) {
            diskList.push({ cdrom: disk.cdrom, diskExisting: product, bus: disk.bus });
          }
        });
        this.diskList = diskList;

        this.updateOutput();
        this.isLoaded.emit(true);
      } else {
        if (this.initDisks()) {
          this.isLoaded.emit(false);
        } else {
          this.isLoaded.emit(true);
        }
      }
    });

    // update cloudinit config when init config is loaded
    effect(() => {
      if (this.initCloudInit()) {
        this.cloudInitForm.reset({
          custom: this.initCloudInit()!.config !== DEFAULT_CLOUD_INIT,
          config: this.initCloudInit()!.config,
          bus: this.initCloudInit()!.bus,
        });
      }
    });

    // Emit change when the form is updated
    this.cloudInitForm.valueChanges
      .pipe(
        takeUntilDestroyed(),
        distinctUntilChanged((a, b) => a.bus === b.bus && a.config === b.config && a.custom === b.custom)
      )
      .subscribe(v => {
        this.cloudInitChange.emit({
          custom: v.custom || false,
          config: v.config,
          bus: v.bus,
        });
      });
  }

  /** filter disk values in the auto complete
   *
   * If the filter is a string, then the user is typing something so we filter by it
   *
   * If it's not, then it's an entire product, meaning the user clicked on a autocomplete option, we return the whole list
   *
   * And just before returning the list, we remove all the disks already added to the list.
   */
  private _filter(filter: string | ProductDisk) {
    if (this.disksProduct.status() === 'error') {
      return [];
    }

    let disks;
    if (typeof filter === 'string' && filter != '') {
      const filterLC = filter.toLowerCase();
      disks = this.disksProduct.value()?.filter(v => v.productName.toLowerCase().includes(filterLC));
    } else {
      disks = this.disksProduct.value();
    }
    return disks?.filter(v => !this.diskList.some(disk => disk.diskExisting?.eid === v.eid));
  }

  addItem() {
    if (this.diskSelected().value) {
      this.diskList.push({
        cdrom: false,
        bus: BUS_AUTO,
        diskExisting: this.diskSelected().getRawValue()! as ProductDisk,
      });
      this.updateOutput();
    }

    this.diskSelected().reset();
  }

  /**
   * Update the list of item when an item is drag and dropped
   */
  drop(event: CdkDragDrop<DiskItem[]>) {
    moveItemInArray(this.diskList, event.previousIndex, event.currentIndex);
    this.updateOutput();
  }

  /**
   * Remove an item by it's index in the list
   */
  removeItemByIndex(index: number) {
    transferArrayItem(this.diskList, [], index, 0);
    this.updateOutput();
    this.diskSelected().reset();
  }

  /**
   * Update the value in the output
   */
  updateOutput() {
    this.disksChange.emit(
      this.diskList.map<CreateInstanceDisk>((v, i) => {
        if (v.diskExisting) {
          return { order: i, cdrom: v.cdrom, bus: v.bus, eid: v.diskExisting.eid };
        } else {
          return { order: i, cdrom: v.cdrom, bus: v.bus, disk: new CreateDisk(v.diskToCreate!) };
        }
      })
    );
  }

  /**
   * Open a dialog allowing to create a new storage
   */
  addNewStorage() {
    if (this.az()) {
      const ref = this.dialog.open(InstanceCreateDiskFormDialog, {
        data: { az: this.az(), initName: this.vmName() || '' },
      });

      ref.afterClosed().subscribe(res => {
        if (res) {
          this.diskList.push({
            cdrom: false,
            bus: BUS_AUTO,
            diskToCreate: res,
          });
          this.updateOutput();
        }
      });
    }
  }

  diskBusChange(disk: DiskItem, event: MatSelectChange) {
    disk.bus = event.value;
    this.updateOutput();
  }

  async openTextEditor() {
    const editorRef = this.dialog.open(TextEditorDialog, {
      data: {
        title: 'CloudInit configuration',
        subtitle: "If you change the password, remember to set the 'expire' value to 'False'",
        text: this.cloudInitForm.get('config')?.value || '',
        readonly: this.cloudInitForm.get('custom')?.value !== true,
      },
      panelClass: 'dialog--large',
    });

    const res = await firstValueFrom<string | undefined>(editorRef.afterClosed());

    // Discard if the value is undefined (match with cancel action)
    if (res === undefined) {
      return;
    }

    this.cloudInitForm.get('config')?.setValue(res);
  }

  toggleContainerDisk(type: string, checked: boolean) {
    this.containerDiskSelections.update(prev => ({ ...prev, [type]: checked }));
    const selected = Object.entries(this.containerDiskSelections())
      .filter(([, v]) => v)
      .map(([k]) => k);
    this.containerDisksChange.emit(selected);
  }
}
