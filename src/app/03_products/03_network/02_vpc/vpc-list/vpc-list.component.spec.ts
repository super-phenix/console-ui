import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VpcListComponent } from './vpc-list.component';

describe('VpcListComponent', () => {
  let component: VpcListComponent;
  let fixture: ComponentFixture<VpcListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VpcListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VpcListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
