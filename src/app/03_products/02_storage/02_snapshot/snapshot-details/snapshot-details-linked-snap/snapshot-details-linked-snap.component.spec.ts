import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnapshotDetailsLinkedSnapComponent } from './snapshot-details-linked-snap.component';

describe('SnapshotDetailsLinkedSnapComponent', () => {
  let component: SnapshotDetailsLinkedSnapComponent;
  let fixture: ComponentFixture<SnapshotDetailsLinkedSnapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotDetailsLinkedSnapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotDetailsLinkedSnapComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
