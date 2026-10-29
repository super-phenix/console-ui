import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { DBaaSEndpoint, PostgresCluster } from '@products/00_shared/models/paas/dbaas/dbaas.model';
import { ProductDBaaS } from '@products/00_shared/models/product.model';
import { DBaaSService } from '@products/00_shared/services/dbaas.service';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { StateService } from '@shared/services/state.service';

export const CNPG_PHASE_HEALTHY = 'Cluster in healthy state';

export interface DBaaSPhaseChip {
  cls: string;
  label: string;
  title: string;
}

export function isDBaaSHealthy(cluster?: PostgresCluster | null): boolean {
  return cluster?.status?.phase === CNPG_PHASE_HEALTHY;
}

// Maps a CNPG cluster phase (free text from the operator) to a status-chip class and a short label.
// The raw phase and its reason are kept in `title` so the CNPG wording stays discoverable.
export function dbaasPhaseChip(cluster?: PostgresCluster | null): DBaaSPhaseChip {
  if (!cluster) {
    return { cls: 'status-chip--pending', label: 'Provisioning', title: 'Waiting for the cluster to appear in the AZ' };
  }
  const phase = cluster.status?.phase || '';
  const title = cluster.status?.phaseReason ? `${phase}: ${cluster.status.phaseReason}` : phase || 'Unknown';
  const chip = (cls: string, label: string) => ({ cls: `status-chip--${cls}`, label, title });

  if (phase === CNPG_PHASE_HEALTHY) {
    return chip('ready', 'Ready');
  }
  if (!phase || phase === 'Setting up primary') {
    return chip('pending', 'Provisioning');
  }
  if (/unable|cannot|not enough|waiting for user/i.test(phase)) {
    return chip('error', 'Needs attention');
  }
  if (/failing over|switchover/i.test(phase)) {
    return chip('warning', 'Failing over');
  }
  if (/restart/i.test(phase)) {
    return chip('pending', 'Restarting');
  }
  if (/replica/i.test(phase)) {
    return chip('pending', 'Adding replica');
  }
  return chip('pending', 'Updating');
}

// Endpoints sorted rw, ro, r so the primary always comes first.
export function sortEndpoints(endpoints?: DBaaSEndpoint[] | null): DBaaSEndpoint[] {
  const order = { rw: 0, ro: 1, r: 2 };
  return [...(endpoints || [])].sort((a, b) => order[a.role || 'r'] - order[b.role || 'r']);
}

export function endpointRoleLabel(role?: string): string {
  switch (role) {
    case 'rw':
      return 'Read-write';
    case 'ro':
      return 'Read-only';
    case 'r':
      return 'Any instance';
    default:
      return 'Endpoint';
  }
}

export function endpointRoleHint(role?: string): string {
  switch (role) {
    case 'rw':
      return 'Primary only. Use it for writes.';
    case 'ro':
      return 'Replicas only. Spreads reads away from the primary.';
    case 'r':
      return 'Primary or replicas.';
    default:
      return '';
  }
}

// Kubernetes quantity multipliers, relative to the unit we display (cores for CPU, GiB for bytes).
const CPU_SUFFIX: Record<string, number> = { '': 1, m: 0.001 };
const BYTES_SUFFIX: Record<string, number> = {
  Ki: 1 / 1024 ** 2,
  Mi: 1 / 1024,
  Gi: 1,
  Ti: 1024,
  K: 1e3 / 1024 ** 3,
  M: 1e6 / 1024 ** 3,
  G: 1e9 / 1024 ** 3,
  T: 1e12 / 1024 ** 3,
};

function parseQuantity(value: string | undefined, suffixes: Record<string, number>): number | undefined {
  const match = value?.trim().match(/^(\d+(?:\.\d+)?)([a-zA-Z]*)$/);
  const factor = match ? suffixes[match[2]] : undefined;
  return match && factor !== undefined ? Number(match[1]) * factor : undefined;
}

// "2", "1500m" -> cores
export function cpuCores(value?: string): number | undefined {
  return parseQuantity(value, CPU_SUFFIX);
}

// "4Gi", "512Mi" -> GiB
export function memoryGiB(value?: string): number | undefined {
  return parseQuantity(value, BYTES_SUFFIX);
}

// Rounds to at most two decimals and drops trailing zeros: 1.5, 6, 0.25
export function formatAmount(value: number): string {
  return String(Math.round(value * 100) / 100);
}

export class DBaaSActions {
  static deleteDBaaS(
    dbaasSvc: DBaaSService,
    stateSvc: StateService,
    dialog: MatDialog,
    az: string,
    db: ProductDBaaS
  ): Promise<boolean> {
    if (az && db.eid) {
      const name = db.productName ? db.productName : db.eid;
      const ref = dialog.open(ConfirmDialog, {
        data: {
          title: `Delete database`,
          html: `
        <p>Are you sure you want to permanently delete "${name}"?</p>
        <span class="color-warn"><strong>Warning:</strong> Every instance and its storage is deleted. The data cannot be recovered.</span>
        `,
          confirmBtn: 'Delete',
        },
      });
      return new Promise(resolve => {
        ref.afterClosed().subscribe(res => {
          if (res == true) {
            firstValueFrom(dbaasSvc.delete(stateSvc.organization()!.id, stateSvc.project()!.id, az, db.eid)).then(() =>
              resolve(true)
            );
          } else {
            resolve(false);
          }
        });
      });
    }
    return Promise.resolve(false);
  }

  static restartDBaaS(
    dbaasSvc: DBaaSService,
    stateSvc: StateService,
    dialog: MatDialog,
    az: string,
    db: ProductDBaaS
  ): Promise<boolean> {
    if (az && db.eid) {
      const name = db.productName ? db.productName : db.eid;
      const ref = dialog.open(ConfirmDialog, {
        data: {
          title: `Restart database`,
          html: `
        <p>Restart every instance of "${name}"?</p>
        <p>Instances restart one at a time, replicas first. Open connections to an instance drop while it restarts.</p>
        `,
          confirmBtn: 'Restart',
        },
      });
      return new Promise(resolve => {
        ref.afterClosed().subscribe(res => {
          if (res == true) {
            firstValueFrom(dbaasSvc.restart(stateSvc.organization()!.id, stateSvc.project()!.id, az, db.eid)).then(() =>
              resolve(true)
            );
          } else {
            resolve(false);
          }
        });
      });
    }
    return Promise.resolve(false);
  }

  static async openArgoCD(dbaasSvc: DBaaSService, stateSvc: StateService, az: string, db: ProductDBaaS) {
    if (az && db.eid) {
      const res = await firstValueFrom(
        dbaasSvc.getArgoLink(stateSvc.organization()!.id, stateSvc.project()!.id, az, db.eid)
      );

      if (res?.link) {
        window.open(res.link, '_blank');
      }
    }
  }
}
