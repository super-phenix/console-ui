import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KaasUpdateComponent } from './kaas-update.component';

describe('KaasUpdateComponent', () => {
  let component: KaasUpdateComponent;
  let fixture: ComponentFixture<KaasUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KaasUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KaasUpdateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
