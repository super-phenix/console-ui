import { Injectable, signal, WritableSignal } from '@angular/core';

export const THEME_KEY = 'theme';

export const INSTANCE_SHOW_CLUSTER_KEY = 'instance_show_cluster';
export const INSTANCE_REFRESH_KEY = 'instance_refresh';

export const INSTANCE_SNAPSHOT_REFRESH_KEY = 'instance_snapshot_refresh';

export const DISK_SHOW_CLUSTER_KEY = 'disk_show_cluster';
export const DISK_REFRESH_KEY = 'disk_refresh';

export const SNAPSHOT_REFRESH_KEY = 'snapshot_refresh';

export const BAAS_REFRESH_KEY = 'baas_refresh';

export const BUCKET_REFRESH_KEY = 'bucket_refresh';

export const VPC_REFRESH_KEY = 'vpc_refresh';

export const SUBNET_REFRESH_KEY = 'subnet_refresh';

export const EIP_REFRESH_KEY = 'eip_refresh';

export const LOAD_BALANCER_REFRESH_KEY = 'load_balancer_refresh';

export const FIREWALL_SHOW_CLUSTER_KEY = 'firewall_show_cluster';
export const FIREWALL_REFRESH_KEY = 'firewall_refresh';

export const KAAS_REFRESH_KEY = 'kaas_refresh';

export const SSH_REFRESH_KEY = 'ssh_refresh';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private signalMap = new Map<string, WritableSignal<string | null>>();

  constructor() {
    // Listen to storage changes across tabs
    window.addEventListener('storage', (event: StorageEvent) => {
      const key = event.key;
      if (key && this.signalMap.has(key)) {
        const valueSignal = this.signalMap.get(key);
        valueSignal?.set(event.newValue);
      }
    });
  }

  getValue(key: string): WritableSignal<string | null> {
    if (this.signalMap.has(key)) {
      return this.signalMap.get(key)!;
    }

    // Create a new signal for the key
    const newSignal = signal<string | null>(localStorage.getItem(key));
    this.signalMap.set(key, newSignal);

    return newSignal;
  }

  setValue(key: string, value: string): WritableSignal<string | null> {
    localStorage.setItem(key, value);

    // Get or create the signal and update it
    const valueSignal = this.getValue(key);
    valueSignal.set(value);

    return valueSignal;
  }

  removeValue(key: string): void {
    localStorage.removeItem(key);

    if (this.signalMap.has(key)) {
      const valueSignal = this.signalMap.get(key);
      valueSignal?.set(null);
    }
  }
}
