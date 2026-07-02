import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { InstanceNetworkCreateComponent } from './instance-network-create.component';

describe('InstanceNetworkCreateComponent', () => {
  let component: InstanceNetworkCreateComponent;
  let fixture: ComponentFixture<InstanceNetworkCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstanceNetworkCreateComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InstanceNetworkCreateComponent);
    fixture.componentRef.setInput('az', null);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
