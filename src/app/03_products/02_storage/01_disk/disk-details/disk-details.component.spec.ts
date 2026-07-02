import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiskDetailsComponent } from './disk-details.component';

describe('DiskDetailsComponent', () => {
  let component: DiskDetailsComponent;
  let fixture: ComponentFixture<DiskDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiskDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
