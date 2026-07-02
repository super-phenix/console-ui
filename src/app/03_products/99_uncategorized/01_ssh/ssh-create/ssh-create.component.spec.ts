import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SshCreateComponent } from './ssh-create.component';

describe('SshCreateComponent', () => {
  let component: SshCreateComponent;
  let fixture: ComponentFixture<SshCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SshCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SshCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
