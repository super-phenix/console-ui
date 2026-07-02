import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KaasDetailsComponent } from './kaas-details.component';

describe('KaasDetailsComponent', () => {
  let component: KaasDetailsComponent;
  let fixture: ComponentFixture<KaasDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KaasDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KaasDetailsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
