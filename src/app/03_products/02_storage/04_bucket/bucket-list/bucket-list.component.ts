import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BucketActions, bucketPhaseChip } from '../bucket-actions.utils';
import { ProductListFilterComponent } from '@products/00_shared/components/product-list-filter/product-list-filter.component';
import {
  defaultSortFunc,
  ProductTableWrapperComponent,
} from '@products/00_shared/components/product-table-wrapper/product-table-wrapper.component';
import { ProductBucket } from '@products/00_shared/models/product.model';
import { BucketService } from '@products/00_shared/services/bucket.service';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { DEFAULT_REFRESH_INTERVAL } from '@shared/models/consts';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { BUCKET_REFRESH_KEY, LocalStorageService } from '@shared/services/local-storage.service';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { mapHandlerReplacer, mapHandlerReviver } from '@shared/utils/json-utils';
import { of } from 'rxjs';

interface ProductBucketItem {
  data: ProductBucket;
}

@Component({
  selector: 'spx-bucket-list',
  imports: [
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    ContentHeaderComponent,
    ProductListFilterComponent,
    ProductTableWrapperComponent,
  ],
  templateUrl: './bucket-list.component.html',
  styleUrl: './bucket-list.component.scss',
})
export class BucketListComponent {
  protected stateSvc = inject(StateService);
  protected bucketSvc = inject(BucketService);
  protected permissionSvc = inject(PermissionService);
  protected route = inject(ActivatedRoute);
  protected lss = inject(LocalStorageService);
  protected router = inject(Router);

  private readonly dialog = inject(MatDialog);

  readonly BUCKET_REFRESH_KEY = BUCKET_REFRESH_KEY;

  readonly bucketPhaseChip = bucketPhaseChip;

  refreshInterval = computed(() => {
    const refresh = this.lss.getValue(BUCKET_REFRESH_KEY)();
    return refresh !== null ? parseInt(refresh, 10) : DEFAULT_REFRESH_INTERVAL;
  });

  canProjectBucketWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectBucketWrite));
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  displayedColumns: string[] = ['az', 'id', 'name', 'storageClass', 'phase', 'gitops', 'actions'];

  // Extends the wrapper's default az/name/id sort with the bucket-specific columns.
  readonly bucketSortFunc = (sort: Sort, a: ProductBucketItem, b: ProductBucketItem): number => {
    const isAsc = sort.direction === 'asc';
    switch (sort.active) {
      case 'storageClass':
        return (a.data.bucket?.storageClass || '').localeCompare(b.data.bucket?.storageClass || '') * (isAsc ? 1 : -1);
      case 'phase':
        return (a.data.bucket?.phase || '').localeCompare(b.data.bucket?.phase || '') * (isAsc ? 1 : -1);
      default:
        return defaultSortFunc(sort, a, b);
    }
  };

  bucketProduct;

  filterValue: WritableSignal<Map<string, string>> = signal(new Map());

  dataSource = computed(() => {
    const buckets = this.bucketProduct.hasValue() ? this.bucketProduct.value()! : [];

    const datas: ProductBucketItem[] = buckets.map(i => ({ data: i }));
    const dataSource = new MatTableDataSource(datas);
    // Override filterPredicate to use nested object
    dataSource.filterPredicate = this.filterPredicate;
    dataSource.filter = JSON.stringify(this.filterValue(), mapHandlerReplacer);

    return dataSource;
  });

  private needReload = signal(0);

  constructor() {
    const stateSvc = this.stateSvc;
    const bucketSvc = this.bucketSvc;

    this.bucketProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.needReload()]),
      stream: () => {
        if (stateSvc.organization() && stateSvc.project()) {
          // errors intentionally propagate so the resource reports 'error' and the
          // template renders the failure state instead of an endless spinner
          return bucketSvc.list(stateSvc.organization()!.id, stateSvc.project()!.id);
        } else {
          return of([]);
        }
      },
    });
  }

  deleteBucket(bucket: ProductBucket) {
    BucketActions.deleteBucket(this.bucketSvc, this.stateSvc, this.dialog, bucket.codeAZ!, bucket).then(res => {
      if (res) {
        this.reloadData();
      }
    });
  }

  openArgoCD(bucket: ProductBucket) {
    BucketActions.openArgoCD(this.bucketSvc, this.stateSvc, bucket.codeAZ!, bucket);
  }

  private filterPredicate(item: ProductBucketItem, filter: string) {
    const filterMap = JSON.parse(filter, mapHandlerReviver);
    // If we have a az filter and it doesn't match
    if (filterMap.get('az') && item.data.codeAZ !== filterMap.get('az')) {
      return false;
    }

    // If we have a text filter
    if (filterMap.get('search')) {
      return (
        item.data.productName.toLowerCase().includes(filterMap.get('search')) ||
        item.data.eid.toLowerCase().includes(filterMap.get('search'))
      );
    } else {
      return true;
    }
  }

  reloadData() {
    this.needReload.update(v => v + 1);
  }
}
