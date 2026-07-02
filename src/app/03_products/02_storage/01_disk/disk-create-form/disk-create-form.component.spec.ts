import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiskCreateFormComponent } from './disk-create-form.component';

describe('DiskCreateFormComponent', () => {
  let component: DiskCreateFormComponent;
  let fixture: ComponentFixture<DiskCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiskCreateFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiskCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
