import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkRuleFormComponent } from './network-rule-form.component';

describe('NetworkRuleFormComponent', () => {
  let component: NetworkRuleFormComponent;
  let fixture: ComponentFixture<NetworkRuleFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetworkRuleFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NetworkRuleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
