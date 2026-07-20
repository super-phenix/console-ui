import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BucketUpdateComponent } from './bucket-update.component';

describe('BucketUpdateComponent', () => {
  let component: BucketUpdateComponent;
  let fixture: ComponentFixture<BucketUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BucketUpdateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BucketUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
