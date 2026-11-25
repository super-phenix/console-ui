import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { InstanceSnapshotCreateDialogComponent } from './instance-snapshot-create-dialog.component';

describe('InstanceSnapshotCreateDialogComponent', () => {
  let component: InstanceSnapshotCreateDialogComponent;
  let fixture: ComponentFixture<InstanceSnapshotCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstanceSnapshotCreateDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { instance: { productName: 'vm' } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InstanceSnapshotCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
