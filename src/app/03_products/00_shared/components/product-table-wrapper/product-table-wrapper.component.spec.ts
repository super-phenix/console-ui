import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableDataSource } from '@angular/material/table';
import { Product } from '@products/00_shared/models/product.model';

import { ProductTableWrapperComponent } from './product-table-wrapper.component';

interface Row {
  data: Product;
}

describe('ProductTableWrapperComponent', () => {
  let component: ProductTableWrapperComponent<Row>;
  let fixture: ComponentFixture<ProductTableWrapperComponent<Row>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductTableWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductTableWrapperComponent as Type<ProductTableWrapperComponent<Row>>);
    fixture.componentRef.setInput('columns', ['name']);
    fixture.componentRef.setInput('dataSource', new MatTableDataSource<Row>([]));
    component = fixture.componentInstance;
    // No detectChanges: this is a content-projection wrapper whose MatTable needs
    // projected column/row defs to render. Full rendering belongs in a host-based
    // test; here we just assert the component constructs.
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
