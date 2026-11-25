import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BucketCreateComponent } from './bucket-create.component';

describe('BucketCreateComponent', () => {
  let component: BucketCreateComponent;
  let fixture: ComponentFixture<BucketCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BucketCreateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BucketCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
