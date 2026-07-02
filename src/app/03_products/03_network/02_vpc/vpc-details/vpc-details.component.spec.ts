import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VpcDetailsComponent } from './vpc-details.component';

describe('VpcDetailsComponent', () => {
  let component: VpcDetailsComponent;
  let fixture: ComponentFixture<VpcDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VpcDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VpcDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
