import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VpcCreateComponent } from './vpc-create.component';

describe('VpcCreateComponent', () => {
  let component: VpcCreateComponent;
  let fixture: ComponentFixture<VpcCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VpcCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VpcCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
