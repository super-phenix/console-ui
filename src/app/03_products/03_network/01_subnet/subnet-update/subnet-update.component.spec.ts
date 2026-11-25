import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SubnetUpdateComponent } from './subnet-update.component';

describe('SubnetUpdateComponent', () => {
  let component: SubnetUpdateComponent;
  let fixture: ComponentFixture<SubnetUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubnetUpdateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SubnetUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
