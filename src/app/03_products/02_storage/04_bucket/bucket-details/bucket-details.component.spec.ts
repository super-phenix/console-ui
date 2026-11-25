import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BucketDetailsComponent } from './bucket-details.component';

describe('BucketDetailsComponent', () => {
  let component: BucketDetailsComponent;
  let fixture: ComponentFixture<BucketDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BucketDetailsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BucketDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
