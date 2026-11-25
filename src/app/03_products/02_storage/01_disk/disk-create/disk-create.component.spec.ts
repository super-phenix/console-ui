import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DiskCreateComponent } from './disk-create.component';

describe('DiskCreateComponent', () => {
  let component: DiskCreateComponent;
  let fixture: ComponentFixture<DiskCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiskCreateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DiskCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
