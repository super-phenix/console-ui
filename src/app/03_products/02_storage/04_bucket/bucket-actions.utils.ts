import { SecurityContext } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { ProductBucket } from '@products/00_shared/models/product.model';
import { BucketCredentials } from '@products/00_shared/models/storage/bucket/bucket.model';
import { BucketService } from '@products/00_shared/services/bucket.service';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { StateService } from '@shared/services/state.service';

// Maps an ObjectBucketClaim phase to a status-chip class suffix and a user-facing
// label. The raw phase is kept in `title` so the k8s wording stays discoverable.
// Note: Failed maps to the red "error" chip on purpose (the "failed" scss class renders amber).
export function bucketPhaseChip(phase?: string): { cls: string; label: string; title: string } {
  switch (phase) {
    case 'Bound':
      return { cls: 'status-chip--ready', label: 'Ready', title: phase };
    case 'Pending':
      return { cls: 'status-chip--pending', label: 'Provisioning', title: phase };
    case 'Failed':
      return { cls: 'status-chip--error', label: 'Failed', title: phase };
    case 'Released':
      return { cls: 'status-chip--deactivated', label: 'Detached', title: phase };
    default:
      return { cls: 'status-chip--unknown', label: 'Unknown', title: phase || 'Unknown' };
  }
}

export class BucketActions {
  static deleteBucket(
    bucketSvc: BucketService,
    stateSvc: StateService,
    dialog: MatDialog,
    az: string,
    bucket: ProductBucket
  ): Promise<boolean> {
    if (az && bucket.eid) {
      const name = bucket.productName ? bucket.productName : bucket.eid;
      const ref = dialog.open(ConfirmDialog, {
        data: {
          title: `Delete bucket`,
          html: `
        <p>Are you sure you want to permanently delete "${name}"?</p>
        <span class="color-warn"><strong>Warning:</strong> Deleting a bucket is permanent and cannot be undone. All objects it contains will be deleted.</span>
        `,
          confirmBtn: 'Delete',
        },
      });
      return new Promise(resolve => {
        ref.afterClosed().subscribe(res => {
          if (res == true) {
            firstValueFrom(bucketSvc.delete(stateSvc.organization()!.id, stateSvc.project()!.id, az, bucket.eid!)).then(
              () => resolve(true)
            );
          } else {
            resolve(false);
          }
        });
      });
    }
    return Promise.resolve(false);
  }

  static async openArgoCD(bucketSvc: BucketService, stateSvc: StateService, az: string, bucket: ProductBucket) {
    if (bucket.gitops === 'true' && az && bucket.eid) {
      const res = await firstValueFrom(
        bucketSvc.getArgoLink(stateSvc.organization()!.id, stateSvc.project()!.id, az, bucket.eid)
      );

      if (res) {
        window.open(res.link, '_blank');
      }
    }
  }

  // Generates the two AWS CLI files (~/.aws/config and ~/.aws/credentials)
  static downloadAwsConfig(sanitizer: DomSanitizer, credentials: BucketCredentials, az?: string): void {
    const profile = credentials.region || az || 'undefined';
    const endpoint = credentials.endpoint.includes('://')
      ? credentials.endpoint
      : `https://${credentials.endpoint}`;

    const config = [
      '[default]',
      `region = ${profile}`,
      `services = ${profile}`,
      'output = json',
      '',
      `[services ${profile}]`,
      's3 =',
      `  endpoint_url = ${endpoint}`,
      '',
    ].join('\n');

    const credentialsFile = [
      '[default]',
      `aws_access_key_id = ${credentials.accessKeyId}`,
      `aws_secret_access_key = ${credentials.secretAccessKey}`,
      '',
    ].join('\n');

    BucketActions.downloadTextFile(sanitizer, config, 'config');
    BucketActions.downloadTextFile(sanitizer, credentialsFile, 'credentials');
  }

  // Generates an s3cmd config (~/.s3cfg)
  static downloadS3cmdConfig(sanitizer: DomSanitizer, credentials: BucketCredentials, az?: string): void {
    let url: URL;
    try {
      url = new URL(credentials.endpoint.includes('://') ? credentials.endpoint : `https://${credentials.endpoint}`);
    } catch {
      return;
    }

    const config = [
      '[default]',
      `access_key = ${credentials.accessKeyId}`,
      `secret_key = ${credentials.secretAccessKey}`,
      `host_base = ${url.host}`,
      `host_bucket = ${url.host}`,
      `bucket_location = ${credentials.region || az || 'undefined'}`,
      `use_https = ${url.protocol === 'https:' ? 'True' : 'False'}`,
      'signature_v2 = False',
      '',
    ].join('\n');

    BucketActions.downloadTextFile(sanitizer, config, '.s3cfg');
  }

  private static downloadTextFile(sanitizer: DomSanitizer, content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const fileUrl = sanitizer.sanitize(
      SecurityContext.RESOURCE_URL,
      sanitizer.bypassSecurityTrustResourceUrl(window.URL.createObjectURL(blob))
    );
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(fileUrl);
    }
  }
}
