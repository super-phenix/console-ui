import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BucketDetailsComponent } from './bucket-details.component';

describe('BucketDetailsComponent', () => {
  let component: BucketDetailsComponent;
  let fixture: ComponentFixture<BucketDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BucketDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BucketDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
