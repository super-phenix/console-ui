import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiskUpdateComponent } from './disk-update.component';

describe('DiskUpdateComponent', () => {
  let component: DiskUpdateComponent;
  let fixture: ComponentFixture<DiskUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiskUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiskUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
