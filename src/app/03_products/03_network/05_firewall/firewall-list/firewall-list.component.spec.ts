import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirewallListComponent } from './firewall-list.component';

describe('FirewallListComponent', () => {
  let component: FirewallListComponent;
  let fixture: ComponentFixture<FirewallListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirewallListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirewallListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
