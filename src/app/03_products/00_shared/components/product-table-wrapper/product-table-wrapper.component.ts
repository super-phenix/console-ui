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
import { Product } from '@products/00_shared/models/product.model';
import { AZService } from '@products/00_shared/services/az.service';
import { StateService } from '@shared/services/state.service';

interface ProductItem {
  data: Product;
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

@Component({
  selector: 'spx-product-table-wrapper',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatSortModule],
  templateUrl: './product-table-wrapper.component.html',
  styleUrl: './product-table-wrapper.component.scss',
})
export class ProductTableWrapperComponent<T extends ProductItem> implements AfterContentInit {
  @ContentChildren(MatHeaderRowDef) headerRowDefs!: QueryList<MatHeaderRowDef>;
  @ContentChildren(MatRowDef) rowDefs!: QueryList<MatRowDef<T>>;
  @ContentChildren(MatColumnDef) columnDefs!: QueryList<MatColumnDef>;
  @ContentChild(MatNoDataRow) noDataRow!: MatNoDataRow;

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

  constructor() {
    effect(() => {
      this.initDataSource();
    });
  }

  ngAfterContentInit() {
    this.columnDefs.forEach(columnDef => this.table.addColumnDef(columnDef));
    this.rowDefs.forEach(rowDef => this.table.addRowDef(rowDef));
    this.headerRowDefs.forEach(headerRowDef => this.table.addHeaderRowDef(headerRowDef));
    this.table.setNoDataRow(this.noDataRow);
  }

  initDataSource() {
    const sortFunc = this.sortDataFunc();
    this.dataSource().sort = this.matTableSort;

    this.dataSource().sortData = (data: T[], sort: MatSort): T[] => {
      return data.sort((a, b) => sortFunc(sort, a, b));
    };

    this.dataSource().data = this.dataSource().data.sort((a, b) => sortFunc(this.defaultSort, a, b));
  }

  trackBy(_: number, product: T) {
    return product.data.eid;
  }
}
