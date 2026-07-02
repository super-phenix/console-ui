import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirewallDetailsComponent } from './firewall-details.component';

describe('FirewallDetailsComponent', () => {
  let component: FirewallDetailsComponent;
  let fixture: ComponentFixture<FirewallDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirewallDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirewallDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
