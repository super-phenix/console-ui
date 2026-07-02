import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstanceSshCreateComponent } from './instance-ssh-create.component';

describe('InstanceSshCreateComponent', () => {
  let component: InstanceSshCreateComponent;
  let fixture: ComponentFixture<InstanceSshCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstanceSshCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InstanceSshCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
