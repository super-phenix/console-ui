import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkSelectComponent } from './network-select.component';

describe('NetworkSelectComponent', () => {
  let component: NetworkSelectComponent;
  let fixture: ComponentFixture<NetworkSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetworkSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NetworkSelectComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
