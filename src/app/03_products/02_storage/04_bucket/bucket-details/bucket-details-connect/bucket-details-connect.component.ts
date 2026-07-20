import { Clipboard } from '@angular/cdk/clipboard';
import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { BucketActions } from '../../bucket-actions.utils';
import { ProductBucket } from '@products/00_shared/models/product.model';
import { BucketCredentials } from '@products/00_shared/models/storage/bucket/bucket.model';
import { BucketService } from '@products/00_shared/services/bucket.service';
import { CodeBlockComponent } from '@shared/components/code-block/code-block.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';

type CliFlavour = 'aws' | 's3cmd';

@Component({
  selector: 'spx-bucket-details-connect',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    CodeBlockComponent,
    SpanCopyComponent,
    GridDirective,
  ],
  templateUrl: './bucket-details-connect.component.html',
})
export class BucketDetailsConnectComponent {
  protected stateSvc = inject(StateService);
  protected bucketSvc = inject(BucketService);
  protected permissionSvc = inject(PermissionService);
  protected sanitizer = inject(DomSanitizer);
  private readonly clipboard = inject(Clipboard);
  private readonly snackbar = inject(MatSnackBar);

  bucket = input.required<ProductBucket>();
  az = input.required<string>();

  canProjectBucketCredentials = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectBucketCredentials)
  );

  credentials = signal<BucketCredentials | undefined>(undefined);
  credentialsLoading = signal(false);
  secretVisible = signal(false);
  cli = signal<CliFlavour>('aws');

  // The bucket name and endpoint are public info, so the snippets render before
  // (and without) revealing any credential.
  private bucketName = computed(() => this.bucket().bucket?.name || this.bucket().eid);
  private endpoint = computed(() => this.bucket().bucket?.endpoint || '<endpoint>');

  snippets = computed(() =>
    this.cli() === 'aws'
      ? [
          { label: 'List objects', code: `aws s3 ls s3://${this.bucketName()}/ --endpoint-url ${this.endpoint()}` },
          {
            label: 'Upload a file',
            code: `aws s3 cp ./my-file s3://${this.bucketName()}/ --endpoint-url ${this.endpoint()}`,
          },
        ]
      : [
          { label: 'List objects', code: `s3cmd ls s3://${this.bucketName()}` },
          { label: 'Upload a file', code: `s3cmd put ./my-file s3://${this.bucketName()}/` },
        ]
  );

  copy(value: string) {
    this.clipboard.copy(value);
    this.snackbar.open('Copy to clipboard!', undefined, {
      horizontalPosition: 'end',
      duration: 3000,
    });
  }

  // Fetches the credentials on demand without revealing them on screen (does not
  // set the `credentials` signal). Returns the cached ones when already revealed.
  private async loadCredentials(): Promise<BucketCredentials | undefined> {
    const existing = this.credentials();
    if (existing) {
      return existing;
    }
    if (this.credentialsLoading()) {
      return undefined;
    }
    this.credentialsLoading.set(true);
    try {
      return await firstValueFrom(
        this.bucketSvc.getCredentials(
          this.stateSvc.organization()!.id,
          this.stateSvc.project()!.id,
          this.az(),
          this.bucket().eid
        )
      );
    } catch (err) {
      console.error(err);
      return undefined;
    } finally {
      this.credentialsLoading.set(false);
    }
  }

  async revealCredentials() {
    const credentials = await this.loadCredentials();
    if (credentials) {
      this.credentials.set(credentials);
    }
  }

  hideCredentials() {
    this.credentials.set(undefined);
    this.secretVisible.set(false);
  }

  async downloadAwsConfig() {
    const credentials = await this.loadCredentials();
    if (credentials) {
      BucketActions.downloadAwsConfig(this.sanitizer, credentials, this.bucket().codeAZ);
    }
  }

  async downloadS3cmdConfig() {
    const credentials = await this.loadCredentials();
    if (credentials) {
      BucketActions.downloadS3cmdConfig(this.sanitizer, credentials, this.bucket().codeAZ);
    }
  }
}
