import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ProductSubnet } from '@products/00_shared/models/product.model';

@Component({
  selector: 'spx-network-select',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
  templateUrl: './network-select.component.html',
  styleUrl: './network-select.component.scss',
})
export class NetworkSelectComponent {
  az = input.required<string | null>();
  subnets = input.required<ProductSubnet[]>();
  initList = input<string[]>();

  networkListChanged = output<ProductSubnet[]>();

  subnetsList = signal<ProductSubnet[]>([]);
  networkList: ProductSubnet[] = [];

  subnetSelected = computed(() => {
    return new FormControl<ProductSubnet | undefined>({
      value: undefined,
      disabled: this.az() === '' || this.az() == null,
    });
  });

  constructor() {
    effect(() => {
      if (this.az() == null || this.az()) {
        this.networkList = [];
        this.updateOutput();
      }
    });

    effect(() => {
      if (this.initList()) {
        this.initList()!.forEach(el => {
          const subnet = this.subnets().find(v => v.id === el);
          if (subnet) {
            this.networkList.push(subnet);
          }
        });

        this.updateOutput();
      }
    });
  }

  addItem() {
    if (this.subnetSelected().value) {
      this.networkList.push(this.subnetSelected().getRawValue()!);
      this.updateOutput();
      this.subnetSelected().reset();
    }
  }

  drop(event: CdkDragDrop<never[]>) {
    moveItemInArray(this.networkList, event.previousIndex, event.currentIndex);
    this.updateOutput();
  }

  removeItemByIndex(index: number) {
    transferArrayItem(this.networkList, [], index, 0);
    this.updateOutput();
  }

  updateOutput() {
    if (this.subnets() && this.subnets().length > 0) {
      this.subnetsList.set(this.subnets().filter(v => this.networkList.findIndex(n => n.eid === v.eid) === -1) || []);
    } else {
      this.subnetsList.set([]);
    }

    this.networkListChanged.emit(this.networkList);
  }
}
