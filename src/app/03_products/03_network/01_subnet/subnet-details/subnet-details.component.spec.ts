import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubnetDetailsComponent } from './subnet-details.component';

describe('SubnetDetailsComponent', () => {
  let component: SubnetDetailsComponent;
  let fixture: ComponentFixture<SubnetDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubnetDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubnetDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
