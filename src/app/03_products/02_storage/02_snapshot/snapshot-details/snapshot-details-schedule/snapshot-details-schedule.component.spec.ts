import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnapshotDetailsScheduleComponent } from './snapshot-details-schedule.component';

describe('SnapshotDetailsScheduleComponent', () => {
  let component: SnapshotDetailsScheduleComponent;
  let fixture: ComponentFixture<SnapshotDetailsScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotDetailsScheduleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotDetailsScheduleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
