import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BucketUpdateComponent } from './bucket-update.component';

describe('BucketUpdateComponent', () => {
  let component: BucketUpdateComponent;
  let fixture: ComponentFixture<BucketUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BucketUpdateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BucketUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
