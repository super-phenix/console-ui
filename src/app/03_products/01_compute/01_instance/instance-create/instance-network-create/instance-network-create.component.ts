import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import {
  CreateInstanceNetwork,
  NETWORK_MODEL_AUTO,
  NETWORK_MODEL_LIST,
} from '@products/00_shared/models/compute/instance/instance';
import { ProductSubnet } from '@products/00_shared/models/product.model';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { CidrForVersion, CidrNetworkAddress } from '@products/00_shared/utils/ip';
import { StateService } from '@shared/services/state.service';
import { ipInCidrValidator, ipValidator } from '@shared/utils/validators';
import { of } from 'rxjs';

interface NetworkItem {
  subnetId: string;
  subnetName: string;
}

@Component({
  selector: 'spx-instance-network-create',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    RouterLink,
  ],
  templateUrl: './instance-network-create.component.html',
  styleUrl: './instance-network-create.component.scss',
})
export class InstanceNetworkCreateComponent {
  protected subnetSvc = inject(SubnetService);
  protected stateSvc = inject(StateService);
  protected fb = inject(FormBuilder);

  protected readonly NETWORK_MODEL_LIST = NETWORK_MODEL_LIST;
  protected readonly NETWORK_MODEL_AUTO = NETWORK_MODEL_AUTO;

  az = input.required<string | null>();
  /**
   * Emit a list of networks with an order and a subnet id
   */
  networksChange = output<CreateInstanceNetwork[]>();
  /**
   * Emit whether every static IP entered is valid (in range / well-formed)
   */
  validChange = output<boolean>();
  /**
   * Initial subnet network list (order is important)
   */
  initList = input<CreateInstanceNetwork[]>();
  networkList: ProductSubnet[] = [];

  protected cidrForVersion = CidrForVersion;
  protected cidrNetworkAddress = CidrNetworkAddress;

  staticIpMap = new Map<string, string>();
  networkModelMap = new Map<string, string>();

  subnetsProduct = rxResource({
    params: () => this.az(),
    stream: () => {
      if (this.az() !== '' && this.stateSvc.organization()?.id && this.stateSvc.project()?.id) {
        return this.subnetSvc.listByAZ(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az()!);
      } else {
        return of([]);
      }
    },
  });

  subnetsList = signal<ProductSubnet[]>([]);

  subnetSelected = computed(() => {
    return new FormControl<ProductSubnet | undefined>({
      value: undefined,
      disabled: this.az() === '' || this.az() == null,
    });
  });

  formIps = this.fb.group({});

  constructor() {
    this.formIps.statusChanges.subscribe(() => this.validChange.emit(this.formIps.valid));

    effect(() => {
      if (this.az() == null || this.az()) {
        this.networkList = [];
        this.staticIpMap.clear();
        this.updateOutput();
      }
    });

    effect(() => {
      if (this.initList() && this.subnetsProduct.status() !== 'error') {
        const networkList: ProductSubnet[] = [];
        this.initList()!.forEach(n => {
          const product = this.subnetsProduct.value()?.find(v => v.eid === n.subnetEId);
          if (product) {
            networkList.push(product);
            if (n.ipv4) {
              this.staticIpMap.set(`${product.id}-v4`, n.ipv4);
            }

            if (n.ipv6) {
              this.staticIpMap.set(`${product.id}-v6`, n.ipv6);
            }

            if (n.model) {
              this.networkModelMap.set(product.id, n.model);
            }

            this.addFormControl(product.id, product.subnet?.spec?.cidrBlock, n.ipv4, n.ipv6, n.model);
          }
        });
        this.networkList = networkList;
        this.updateOutput();
      }
    });
  }

  addItem() {
    if (this.subnetSelected().value) {
      const subnet = this.subnetSelected().value!;
      this.addFormControl(subnet.id, subnet.subnet?.spec?.cidrBlock);
      this.networkList.push(this.subnetSelected().getRawValue()!);
      this.updateOutput();
      this.subnetSelected().reset();
    }
  }

  addFormControl(id: string, cidr?: string, ipv4?: string, ipv6?: string, model?: string) {
    const group = new FormGroup({});

    const v4Cidr = cidr ? CidrForVersion(cidr, 4) : undefined;
    const v6Cidr = cidr ? CidrForVersion(cidr, 6) : undefined;

    group.addControl('v4', new FormControl(ipv4 || '', [ipValidator(), ipInCidrValidator(v4Cidr)]));
    group.addControl('v6', new FormControl(ipv6 || '', [ipValidator(), ipInCidrValidator(v6Cidr)]));
    group.addControl('model', new FormControl(model || ''));

    this.formIps.addControl(id, group);
  }

  drop(event: CdkDragDrop<NetworkItem[]>) {
    moveItemInArray(this.networkList, event.previousIndex, event.currentIndex);
    this.updateOutput();
  }

  removeItemByIndex(index: number) {
    transferArrayItem(this.networkList, [], index, 0);
    this.updateOutput();
  }

  updateOutput() {
    if (this.subnetsProduct.status() !== 'error') {
      this.subnetsList.set(
        this.subnetsProduct.value()?.filter(v => this.networkList.findIndex(n => n.eid === v.eid) === -1) || []
      );
    } else {
      this.subnetsList.set([]);
    }

    this.networksChange.emit(
      this.networkList.map<CreateInstanceNetwork>((v, i) => {
        return {
          order: i,
          subnetEId: v.eid,
          ipv4: this.staticIpMap.get(`${v.id}-v4`),
          ipv6: this.staticIpMap.get(`${v.id}-v6`),
          model: this.networkModelMap.get(v.id),
        };
      })
    );

    this.validChange.emit(this.formIps.valid);
  }

  updateStaticIp(id: string, ip: string, type: 'v4' | 'v6') {
    this.staticIpMap.set(`${id}-${type}`, ip);
    this.updateOutput();
  }

  updateNetworkModel(id: string, model: string) {
    this.networkModelMap.set(id, model);
    this.updateOutput();
  }
}
