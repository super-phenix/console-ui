import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirewallUpdateComponent } from './firewall-update.component';

describe('FirewallUpdateComponent', () => {
  let component: FirewallUpdateComponent;
  let fixture: ComponentFixture<FirewallUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirewallUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirewallUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
