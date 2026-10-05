import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductKaaS } from '@products/00_shared/models/product.model';

import { KaasListComponent } from './kaas-list.component';

describe('KaasListComponent', () => {
  let component: KaasListComponent;
  let fixture: ComponentFixture<KaasListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KaasListComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(KaasListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('hasOutdatedCluster', () => {
    const mockClusters = (clusters: ProductKaaS[] | undefined) => {
      component.kaasProduct = {
        hasValue: () => clusters !== undefined,
        value: () => clusters,
      } as unknown as typeof component.kaasProduct;
    };

    it('should return true when at least one cluster is outdated', () => {
      mockClusters([{ outdated: false } as ProductKaaS, { outdated: true } as ProductKaaS]);
      expect(component.hasOutdatedCluster()).toBeTrue();
    });

    it('should return false when no cluster is outdated', () => {
      mockClusters([{ outdated: false } as ProductKaaS, {} as ProductKaaS]);
      expect(component.hasOutdatedCluster()).toBeFalse();
    });

    it('should return false when there is no cluster', () => {
      mockClusters([]);
      expect(component.hasOutdatedCluster()).toBeFalse();
    });

    it('should return false when the resource has no value', () => {
      mockClusters(undefined);
      expect(component.hasOutdatedCluster()).toBeFalse();
    });
  });
});
