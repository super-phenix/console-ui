import {
  AfterContentInit,
  Component,
  ContentChild,
  ContentChildren,
  effect,
  inject,
  input,
  QueryList,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import {
  MatColumnDef,
  MatHeaderRowDef,
  MatNoDataRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { Product } from '@products/00_shared/models/product.model';
import { AZService } from '@products/00_shared/services/az.service';
import { StateService } from '@shared/services/state.service';

export interface ProductItem {
  data: Product;
  isDR?: boolean;
}

export function defaultSortFunc<T extends ProductItem>(sort: Sort, a: T, b: T) {
  const isAsc = sort.direction === 'asc';
  switch (sort.active) {
    case 'az': {
      const codeA = a.data.codeAZ || '';
      const codeB = b.data.codeAZ || '';
      return codeA.localeCompare(codeB) * (isAsc ? 1 : -1);
    }
    case 'name':
      return a.data.productName.localeCompare(b.data.productName) * (isAsc ? 1 : -1);
    case 'id':
      return a.data.eid.localeCompare(b.data.eid) * (isAsc ? 1 : -1);
    default:
      return 0;
  }
}

// Keeps DR children right below their parent (same eid), whatever the active
// sort is: groups sort by their parent's values, children follow the parent.
export function drGroupSort<T extends ProductItem>(data: T[], cmp: (a: T, b: T) => number): T[] {
  const groups = new Map<string, { head?: T; children: T[] }>();
  for (const item of data) {
    const group = groups.get(item.data.eid) ?? { children: [] };
    if (!item.isDR && !group.head) {
      group.head = item;
    } else {
      group.children.push(item);
    }
    groups.set(item.data.eid, group);
  }

  const flat: { head: T; children: T[] }[] = [];
  for (const group of groups.values()) {
    group.children.sort((a, b) => (a.data.codeAZ ?? '').localeCompare(b.data.codeAZ ?? ''));
    // parent filtered out (AZ filter...): first child takes its place
    const head = group.head ?? group.children.shift()!;
    flat.push({ head, children: group.children });
  }

  flat.sort((a, b) => cmp(a.head, b.head));
  return flat.flatMap(group => [group.head, ...group.children]);
}

@Component({
  selector: 'spx-product-table-wrapper',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatSortModule, RouterLink],
  templateUrl: './product-table-wrapper.component.html',
  styleUrl: './product-table-wrapper.component.scss',
})
export class ProductTableWrapperComponent<T extends ProductItem> implements AfterContentInit {
  @ContentChildren(MatHeaderRowDef) headerRowDefs!: QueryList<MatHeaderRowDef>;
  @ContentChildren(MatRowDef) rowDefs!: QueryList<MatRowDef<T>>;
  @ContentChildren(MatColumnDef) columnDefs!: QueryList<MatColumnDef>;
  // Escape hatch: a list can still project its own `*matNoDataRow`, which wins over the
  // built-in empty state below.
  @ContentChild(MatNoDataRow) projectedNoDataRow?: MatNoDataRow;
  // Declared in this component's own template. View queries never traverse projected
  // content, so this can never accidentally match a list's override.
  @ViewChild(MatNoDataRow, { static: true }) defaultNoDataRow!: MatNoDataRow;

  @ViewChild(MatTable, { static: true }) table!: MatTable<T>;
  @ViewChild('matTableSort') matTableSort = new MatSort();

  private stateSvc = inject(StateService);

  getAzLogoUrl(azCode: string | undefined): string {
    return AZService.getLogoUrl(azCode, this.stateSvc.azList());
  }

  defaultSort: Sort = {
    active: 'name',
    direction: 'asc',
  };

  readonly columns = input.required<string[]>();
  readonly dataSource = input.required<MatTableDataSource<T>>();
  // Optional override so a list can sort its own extra columns; defaults to the
  // shared az/name/id comparator.
  readonly sortDataFunc = input<(sort: Sort, a: T, b: T) => number>(defaultSortFunc);

  // Built-in empty state, shown when the table renders no rows.
  readonly emptyMessage = input('No data for this product type');
  // A falsy label means "message only, no shortcut" — for products that can't be created
  // from their own list page.
  readonly emptyCreateLabel = input('');
  readonly canCreate = input(false);
  // Relative segment by default, resolved against the host list's route; an absolute path
  // works too, for products created from somewhere else.
  readonly createLink = input('create');
  // Must match the width of the list's own `actions` column.
  readonly actionsColumnWidth = input<'single' | 'double' | 'wide'>('double');

  constructor() {
    effect(() => {
      this.initDataSource();
    });
  }

  ngAfterContentInit() {
    this.columnDefs.forEach(columnDef => this.table.addColumnDef(columnDef));
    this.rowDefs.forEach(rowDef => this.table.addRowDef(rowDef));
    this.headerRowDefs.forEach(headerRowDef => this.table.addHeaderRowDef(headerRowDef));
    this.table.setNoDataRow(this.projectedNoDataRow ?? this.defaultNoDataRow);
  }

  initDataSource() {
    const sortFunc = this.sortDataFunc();
    this.dataSource().sort = this.matTableSort;

    this.dataSource().sortData = (data: T[], sort: MatSort): T[] => {
      return drGroupSort(data, (a, b) => sortFunc(sort, a, b));
    };

    this.dataSource().data = drGroupSort(this.dataSource().data, (a, b) => sortFunc(this.defaultSort, a, b));
  }

  trackBy(_: number, product: T) {
    // a DR child shares its parent's eid, the AZ disambiguates
    return product.data.eid + '|' + (product.data.codeAZ ?? '');
  }
}
