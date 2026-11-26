import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DBaaSDetailsComponent } from './dbaas-details.component';

describe('DBaaSDetailsComponent', () => {
  let component: DBaaSDetailsComponent;
  let fixture: ComponentFixture<DBaaSDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DBaaSDetailsComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(DBaaSDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
