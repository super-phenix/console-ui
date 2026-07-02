import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubnetListComponent } from './subnet-list.component';

describe('SubnetListComponent', () => {
  let component: SubnetListComponent;
  let fixture: ComponentFixture<SubnetListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubnetListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubnetListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
