import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SnapshotDetailsSingleComponent } from './snapshot-details-single.component';

describe('SnapshotDetailsSingleComponent', () => {
  let component: SnapshotDetailsSingleComponent;
  let fixture: ComponentFixture<SnapshotDetailsSingleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnapshotDetailsSingleComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SnapshotDetailsSingleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('az', 'az1');
    fixture.componentRef.setInput('snapshotResource', {
      id: 'snap',
      eid: 'snap-1',
      productName: 'snap',
      codeAZ: 'az1',
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
