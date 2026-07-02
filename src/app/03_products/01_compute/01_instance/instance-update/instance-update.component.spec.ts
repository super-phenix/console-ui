import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstanceUpdateComponent } from './instance-update.component';

describe('InstanceUpdateComponent', () => {
  let component: InstanceUpdateComponent;
  let fixture: ComponentFixture<InstanceUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstanceUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstanceUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
