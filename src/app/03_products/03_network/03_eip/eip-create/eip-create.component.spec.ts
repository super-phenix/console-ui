import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EipCreateComponent } from './eip-create.component';

describe('EipCreateComponent', () => {
  let component: EipCreateComponent;
  let fixture: ComponentFixture<EipCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EipCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EipCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
