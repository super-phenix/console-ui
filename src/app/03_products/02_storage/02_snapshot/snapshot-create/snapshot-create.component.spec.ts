import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SnapshotCreateComponent } from './snapshot-create.component';

describe('SnapshotCreateComponent', () => {
  let component: SnapshotCreateComponent;
  let fixture: ComponentFixture<SnapshotCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotCreateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
