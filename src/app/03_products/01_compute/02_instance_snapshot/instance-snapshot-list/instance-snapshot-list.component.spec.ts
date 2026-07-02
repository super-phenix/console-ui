import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstanceSnapshotListComponent } from './instance-snapshot-list.component';

describe('InstanceSnapshotListComponent', () => {
  let component: InstanceSnapshotListComponent;
  let fixture: ComponentFixture<InstanceSnapshotListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstanceSnapshotListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstanceSnapshotListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
