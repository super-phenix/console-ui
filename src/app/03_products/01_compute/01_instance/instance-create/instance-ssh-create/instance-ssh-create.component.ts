import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import { Component, computed, effect, inject, input, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CreateInstanceSsh } from '@products/00_shared/models/compute/instance/instance';
import { ProductSSH } from '@products/00_shared/models/product.model';
import { SshService } from '@products/00_shared/services/ssh.service';
import { StateService } from '@shared/services/state.service';
import { map, of, startWith } from 'rxjs';

@Component({
  selector: 'spx-instance-ssh-create',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
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
  ],
  templateUrl: './instance-ssh-create.component.html',
  styleUrl: './instance-ssh-create.component.scss',
})
export class InstanceSshCreateComponent {
  protected sshSvc = inject(SshService);
  protected stateSvc = inject(StateService);

  az = input.required<string | null>();

  initSshKeys = input<string[]>();

  /**
   * Emit a list of SSH keys
   */
  sshKeysChange = output<CreateInstanceSsh[]>();

  // The list of disk selected by the user
  sshList: CreateInstanceSsh[] = [];

  /**
   * Disk Input
   *
   * It's contains either a string (when the user is filtering values)
   * Or a ProductDisk when the user select a option in the autocomplete field
   */
  sshKeySelected = computed(() => {
    return new FormControl<ProductSSH | undefined>({
      value: undefined,
      disabled: this.az() === '' || this.az() == null,
    });
  });

  /**
   * List of all available product based on the current az value
   */
  sshKeysProduct = rxResource({
    params: () => this.az(),
    stream: () => {
      if (this.az() !== '' && this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.sshSvc.listByAZ(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az()!);
      } else {
        return of([]);
      }
    },
  });

  /**
   * Observable containing the list of all disk matching with the filter input
   */
  filteredOptions = computed(() => {
    // Used to update filter when the product is loaded
    if (this.sshKeysProduct.status() !== 'error') {
      this.sshKeysProduct.value();
      return this.sshKeySelected().valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value || ''))
      );
    } else {
      return of([]);
    }
  });

  constructor() {
    effect(() => {
      if (this.az() == null || this.az()) {
        this.sshList = [];
        this.updateOutput();
      }
    });

    effect(() => {
      if (this.initSshKeys() && this.sshKeysProduct.status() != 'error') {
        const sshList: CreateInstanceSsh[] = [];
        this.initSshKeys()!.forEach(sshKey => {
          const product = this.sshKeysProduct.value()?.find(v => v.eid === sshKey);
          if (product) {
            sshList.push({
              name: product.productName,
              eid: product.eid,
            });
          }
        });
        this.sshList = sshList;

        this.updateOutput();
      }
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
  private _filter(filter: string | ProductSSH) {
    if (this.sshKeysProduct.status() === 'error') {
      return [];
    }

    let sshKeys;
    if (typeof filter === 'string' && filter != '') {
      const filterLC = filter.toLowerCase();
      sshKeys = this.sshKeysProduct.value()?.filter(v => v.productName.toLowerCase().includes(filterLC));
    } else {
      sshKeys = this.sshKeysProduct.value();
    }
    return sshKeys?.filter(v => !this.sshList.some(sshKey => sshKey.eid === v.eid));
  }

  addItem() {
    if (this.sshKeySelected().value) {
      this.sshList.push({
        name: this.sshKeySelected().value!.productName,
        eid: this.sshKeySelected().value!.eid,
      });
      this.updateOutput();
    }

    this.sshKeySelected().reset();
  }

  /**
   * Update the list of item when an item is drag and dropped
   */
  drop(event: CdkDragDrop<CreateInstanceSsh[]>) {
    moveItemInArray(this.sshList, event.previousIndex, event.currentIndex);
    this.updateOutput();
  }

  /**
   * Remove an item by it's index in the list
   */
  removeItemByIndex(index: number) {
    transferArrayItem(this.sshList, [], index, 0);
    this.updateOutput();
    this.sshKeySelected().reset();
  }

  /**
   * Update the value in the output
   */
  updateOutput() {
    this.sshKeysChange.emit(this.sshList);
  }
}
