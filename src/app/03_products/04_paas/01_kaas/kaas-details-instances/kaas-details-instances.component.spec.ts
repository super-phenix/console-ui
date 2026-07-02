import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KaasDetailsInstancesComponent } from './kaas-details-instances.component';

describe('KaasDetailsInstancesComponent', () => {
  let component: KaasDetailsInstancesComponent;
  let fixture: ComponentFixture<KaasDetailsInstancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KaasDetailsInstancesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KaasDetailsInstancesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
