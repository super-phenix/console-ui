import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirewallCreateComponent } from './firewall-create.component';

describe('FirewallCreateComponent', () => {
  let component: FirewallCreateComponent;
  let fixture: ComponentFixture<FirewallCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirewallCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirewallCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
