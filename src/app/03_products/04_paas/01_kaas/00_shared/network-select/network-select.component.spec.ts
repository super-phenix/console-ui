import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkSelectComponent } from './network-select.component';

describe('NetworkSelectComponent', () => {
  let component: NetworkSelectComponent;
  let fixture: ComponentFixture<NetworkSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetworkSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NetworkSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('az', 'az1');
    fixture.componentRef.setInput('subnets', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
