import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DBaaSListComponent } from './dbaas-list.component';

describe('DBaaSListComponent', () => {
  let component: DBaaSListComponent;
  let fixture: ComponentFixture<DBaaSListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DBaaSListComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DBaaSListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
