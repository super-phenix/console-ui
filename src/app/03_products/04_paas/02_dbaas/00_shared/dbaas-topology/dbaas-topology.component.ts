import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DBaaSEndpoint, DBaaSEndpointRole } from '@products/00_shared/models/paas/dbaas/dbaas.model';
import { endpointRoleHint, endpointRoleLabel } from '../../dbaas-actions.utils';

// Ports exposed by the sfs-dbaas chart load balancer, used while the real endpoints are not known yet.
const DEFAULT_PORTS: Record<DBaaSEndpointRole, number> = { rw: 5432, ro: 5433, r: 5434 };

interface Rail {
  role: DBaaSEndpointRole;
  port: number;
  label: string;
  hint: string;
  // 1-based grid columns the rail spans
  start: number;
  end: number;
}

/**
 * Draws a Postgres cluster as one primary and its standby replicas, with the
 * load-balancer endpoints as rails under the instances each one reaches.
 * Used live on the details page and as a preview while sizing a database.
 */
@Component({
  selector: 'spx-dbaas-topology',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './dbaas-topology.component.html',
  styleUrl: './dbaas-topology.component.scss',
})
export class DBaaSTopologyComponent {
  instances = input.required<number>();
  // Undefined in preview mode
  readyInstances = input<number>();
  currentPrimary = input<string>();
  endpoints = input<DBaaSEndpoint[] | null>();
  host = input<string>();

  readonly nodes = computed(() => Array.from({ length: Math.max(1, this.instances()) }, (_, i) => i));

  readonly isPreview = computed(() => this.readyInstances() === undefined);

  readonly rails = computed<Rail[]>(() => {
    const count = Math.max(1, this.instances());
    const known = this.endpoints();
    const roles: DBaaSEndpointRole[] = known?.length
      ? known.map(e => e.role || 'r')
      : count > 1
        ? ['rw', 'ro', 'r']
        : ['rw', 'r'];
    const order = { rw: 0, ro: 1, r: 2 };

    return [...new Set(roles)]
      .sort((a, b) => order[a] - order[b])
      .map(role => {
        const port = known?.find(e => (e.role || 'r') === role)?.port ?? DEFAULT_PORTS[role];
        const span = role === 'rw' ? [1, 2] : role === 'ro' ? [2, count + 1] : [1, count + 1];
        return {
          role,
          port,
          label: endpointRoleLabel(role),
          hint: endpointRoleHint(role),
          start: span[0],
          end: span[1],
        };
      });
  });

  readonly readyRatio = computed(() => {
    const ready = this.readyInstances() ?? 0;
    return Math.min(1, ready / Math.max(1, this.instances()));
  });
}
