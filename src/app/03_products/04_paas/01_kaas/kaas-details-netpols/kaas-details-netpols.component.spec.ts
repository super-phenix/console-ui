import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KaasDetailsNetpolsComponent } from './kaas-details-netpols.component';

describe('KaasDetailsNetpolsComponent', () => {
  let component: KaasDetailsNetpolsComponent;
  let fixture: ComponentFixture<KaasDetailsNetpolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KaasDetailsNetpolsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KaasDetailsNetpolsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
