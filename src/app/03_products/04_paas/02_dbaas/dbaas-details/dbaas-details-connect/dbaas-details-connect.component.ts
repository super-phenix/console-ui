import { Clipboard } from '@angular/cdk/clipboard';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  DBaaSCredentials,
  DBaaSEndpoint,
  DBaaSEndpointRole,
  DBaaSNetwork,
} from '@products/00_shared/models/paas/dbaas/dbaas.model';
import { ProductDBaaS } from '@products/00_shared/models/product.model';
import { DBaaSService } from '@products/00_shared/services/dbaas.service';
import { CodeBlockComponent } from '@shared/components/code-block/code-block.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';
import { endpointRoleHint, endpointRoleLabel, isDBaaSHealthy, sortEndpoints } from '../../dbaas-actions.utils';

type ClientFlavour = 'psql' | 'uri';

@Component({
  selector: 'spx-dbaas-details-connect',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    CodeBlockComponent,
    SpanCopyComponent,
  ],
  templateUrl: './dbaas-details-connect.component.html',
  styleUrl: './dbaas-details-connect.component.scss',
})
export class DBaaSDetailsConnectComponent {
  protected stateSvc = inject(StateService);
  protected dbaasSvc = inject(DBaaSService);
  protected permissionSvc = inject(PermissionService);
  private readonly clipboard = inject(Clipboard);
  private readonly snackbar = inject(MatSnackBar);

  readonly endpointRoleLabel = endpointRoleLabel;
  readonly endpointRoleHint = endpointRoleHint;

  db = input.required<ProductDBaaS>();
  az = input.required<string>();
  // Endpoints through the Elastic IP, empty while unknown or when the user cannot read EIPs
  publicEndpoints = input<DBaaSEndpoint[]>([]);
  initialNetwork = input<DBaaSNetwork>('private');

  // The credentials endpoint returns the password, so the API gates it behind write access.
  canProjectDBaaSWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectDBaaSWrite));

  isReady = computed(() => isDBaaSHealthy(this.db().cluster));
  endpoints = computed(() => sortEndpoints(this.db().endpoints));

  credentials = signal<DBaaSCredentials | undefined>(undefined);
  credentialsLoading = signal(false);
  secretVisible = signal(false);
  client = signal<ClientFlavour>('psql');
  role = signal<DBaaSEndpointRole>('rw');
  network = linkedSignal(() => this.initialNetwork());
  // Falls back to the private network while the public address is unknown
  activeNetwork = computed<DBaaSNetwork>(() =>
    this.network() === 'public' && this.publicEndpoints().length ? 'public' : 'private'
  );
  // Endpoints of the network in use; both networks expose the same roles
  activeEndpoints = computed(() => (this.activeNetwork() === 'public' ? this.publicEndpoints() : this.endpoints()));

  // Snippets never embed the password: psql prompts for it, the URI keeps a placeholder.
  snippet = computed(() => {
    const endpoint = this.activeEndpoints().find(e => e.role === this.role()) || this.activeEndpoints()[0];
    const host = endpoint?.host || '<host>';
    const port = endpoint?.port || 5432;
    const user = this.credentials()?.username || '<user>';
    const dbname = this.credentials()?.dbname || '<database>';
    return this.client() === 'psql'
      ? `psql "host=${host} port=${port} dbname=${dbname} user=${user} sslmode=require"`
      : `postgresql://${user}:<password>@${host}:${port}/${dbname}?sslmode=require`;
  });

  copy(value: string) {
    this.clipboard.copy(value);
    this.snackbar.open('Copy to clipboard!', undefined, {
      horizontalPosition: 'end',
      duration: 3000,
    });
  }

  async revealCredentials() {
    if (this.credentials() || this.credentialsLoading()) {
      return;
    }
    this.credentialsLoading.set(true);
    try {
      const credentials = await firstValueFrom(
        this.dbaasSvc.getCredentials(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.az(),
          this.db().eid
        )
      );
      this.credentials.set(credentials);
    } catch (err) {
      console.error(err);
    } finally {
      this.credentialsLoading.set(false);
    }
  }

  hideCredentials() {
    this.credentials.set(undefined);
    this.secretVisible.set(false);
  }
}
