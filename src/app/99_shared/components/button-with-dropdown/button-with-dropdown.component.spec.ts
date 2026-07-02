import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonWithDropdownComponent } from './button-with-dropdown.component';

describe('ButtonWithDropdownComponent', () => {
  let component: ButtonWithDropdownComponent;
  let fixture: ComponentFixture<ButtonWithDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonWithDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ButtonWithDropdownComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
