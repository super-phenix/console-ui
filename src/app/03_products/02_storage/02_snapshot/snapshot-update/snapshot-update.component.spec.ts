import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnapshotUpdateComponent } from './snapshot-update.component';

describe('SnapshotUpdateComponent', () => {
  let component: SnapshotUpdateComponent;
  let fixture: ComponentFixture<SnapshotUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotUpdateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotUpdateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
