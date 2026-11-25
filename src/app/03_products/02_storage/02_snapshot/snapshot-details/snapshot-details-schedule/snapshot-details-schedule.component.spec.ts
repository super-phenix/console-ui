import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SnapshotDetailsScheduleComponent } from './snapshot-details-schedule.component';

describe('SnapshotDetailsScheduleComponent', () => {
  let component: SnapshotDetailsScheduleComponent;
  let fixture: ComponentFixture<SnapshotDetailsScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotDetailsScheduleComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotDetailsScheduleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('az', 'az1');
    fixture.componentRef.setInput('snapshotResource', {
      id: 'snap',
      eid: 'snap-1',
      productName: 'snap',
      codeAZ: 'az1',
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
