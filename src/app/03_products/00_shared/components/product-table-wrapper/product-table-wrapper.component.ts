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

interface SortMethod<T extends ProductItem> {
  sort: Sort;
  sortFunc: (sort: Sort, a: T, b: T) => number;
}

function defaultSortFunc<T extends ProductItem>(sort: Sort, a: T, b: T) {
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

function sortData<T extends ProductItem>(this: SortMethod<T>, a: T, b: T) {
  return this.sortFunc(this.sort, a, b);
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
  readonly sortDataFunc = defaultSortFunc;

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
    this.dataSource().sort = this.matTableSort;

    this.dataSource().sortData = (data: T[], sort: MatSort): T[] => {
      return data.sort(
        sortData.bind({
          sort: sort,
          sortFunc: this.sortDataFunc,
        })
      );
    };

    this.dataSource().data = this.dataSource().data.sort(
      sortData.bind({
        sort: this.defaultSort,
        sortFunc: this.sortDataFunc,
      })
    );
  }

  trackBy(_: number, product: T) {
    return product.data.eid;
  }
}
