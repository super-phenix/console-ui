import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SubnetCreateComponent } from './subnet-create.component';

describe('SubnetCreateComponent', () => {
  let component: SubnetCreateComponent;
  let fixture: ComponentFixture<SubnetCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubnetCreateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SubnetCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
