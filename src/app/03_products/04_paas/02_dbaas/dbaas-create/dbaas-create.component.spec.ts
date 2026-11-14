import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DBaaSCreateComponent } from './dbaas-create.component';

describe('DBaaSCreateComponent', () => {
  let component: DBaaSCreateComponent;
  let fixture: ComponentFixture<DBaaSCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DBaaSCreateComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(DBaaSCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('prefills a valid virtual IP', () => {
    expect(component.networkFormGroup.controls.vip.valid).toBe(true);
  });

  const vipCases: { name: string; value: string; valid: boolean }[] = [
    { name: 'in range', value: '198.18.10.20', valid: true },
    { name: 'out of range', value: '10.0.0.1', valid: false },
    { name: 'not an ip', value: 'db.local', valid: false },
    { name: 'empty', value: '', valid: false },
  ];

  vipCases.forEach(({ name, value, valid }) => {
    it(`validates the virtual IP: ${name}`, () => {
      const vip = component.networkFormGroup.controls.vip;
      vip.setValue(value);
      expect(vip.valid).toBe(valid);
    });
  });
});
