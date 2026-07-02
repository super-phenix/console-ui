import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstanceDetailsStorageComponent } from './instance-details-storage.component';

describe('InstanceDetailsStorageComponent', () => {
  let component: InstanceDetailsStorageComponent;
  let fixture: ComponentFixture<InstanceDetailsStorageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstanceDetailsStorageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstanceDetailsStorageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
