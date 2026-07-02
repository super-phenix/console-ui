import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstanceSnapshotDetailsComponent } from './instance-snapshot-details.component';

describe('InstanceSnapshotDetailsComponent', () => {
  let component: InstanceSnapshotDetailsComponent;
  let fixture: ComponentFixture<InstanceSnapshotDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstanceSnapshotDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstanceSnapshotDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
