import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnapshotDetailsComponent } from './snapshot-details.component';

describe('SnapshotDetailsComponent', () => {
  let component: SnapshotDetailsComponent;
  let fixture: ComponentFixture<SnapshotDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SnapshotDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
