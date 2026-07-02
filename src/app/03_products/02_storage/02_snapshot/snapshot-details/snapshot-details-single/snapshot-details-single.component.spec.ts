import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnapshotDetailsSingleComponent } from './snapshot-details-single.component';

describe('SnapshotDetailsSingleComponent', () => {
  let component: SnapshotDetailsSingleComponent;
  let fixture: ComponentFixture<SnapshotDetailsSingleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotDetailsSingleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotDetailsSingleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
