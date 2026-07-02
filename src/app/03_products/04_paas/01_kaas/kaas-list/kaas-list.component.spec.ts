import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KaasListComponent } from './kaas-list.component';

describe('KaasListComponent', () => {
  let component: KaasListComponent;
  let fixture: ComponentFixture<KaasListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KaasListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KaasListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
