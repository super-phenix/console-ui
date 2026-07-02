import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstanceSnapshotCreateDialogComponent } from './instance-snapshot-create-dialog.component';

describe('VmSnapshotCreateDialogComponent', () => {
  let component: InstanceSnapshotCreateDialogComponent;
  let fixture: ComponentFixture<InstanceSnapshotCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstanceSnapshotCreateDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InstanceSnapshotCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
