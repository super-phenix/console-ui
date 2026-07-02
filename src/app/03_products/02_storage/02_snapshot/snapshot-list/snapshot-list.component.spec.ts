import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnapshotListComponent } from './snapshot-list.component';

describe('SnapshotListComponent', () => {
  let component: SnapshotListComponent;
  let fixture: ComponentFixture<SnapshotListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnapshotListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
