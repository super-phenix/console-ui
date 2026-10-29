import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DBaaSUpdateComponent } from './dbaas-update.component';

describe('DBaaSUpdateComponent', () => {
  let component: DBaaSUpdateComponent;
  let fixture: ComponentFixture<DBaaSUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DBaaSUpdateComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(DBaaSUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
