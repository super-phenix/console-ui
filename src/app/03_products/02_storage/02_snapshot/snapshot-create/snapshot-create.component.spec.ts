import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnapshotCreateComponent } from './snapshot-create.component';

describe('SnapshotCreateComponent', () => {
  let component: SnapshotCreateComponent;
  let fixture: ComponentFixture<SnapshotCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
