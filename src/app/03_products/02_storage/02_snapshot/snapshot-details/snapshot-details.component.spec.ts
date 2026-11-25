import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SnapshotDetailsComponent } from './snapshot-details.component';

describe('SnapshotDetailsComponent', () => {
  let component: SnapshotDetailsComponent;
  let fixture: ComponentFixture<SnapshotDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotDetailsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
