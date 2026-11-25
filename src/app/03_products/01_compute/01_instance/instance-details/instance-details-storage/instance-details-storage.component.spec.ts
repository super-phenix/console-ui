import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { InstanceDetailsStorageComponent } from './instance-details-storage.component';

describe('InstanceDetailsStorageComponent', () => {
  let component: InstanceDetailsStorageComponent;
  let fixture: ComponentFixture<InstanceDetailsStorageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstanceDetailsStorageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InstanceDetailsStorageComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('az', 'az1');
    fixture.componentRef.setInput('instance', { id: 'vm', eid: 'vm-1', productName: 'vm', codeAZ: 'az1' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
