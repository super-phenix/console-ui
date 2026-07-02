import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstanceStorageCreateComponent } from './instance-storage-create.component';

describe('InstanceStorageCreateComponent', () => {
  let component: InstanceStorageCreateComponent;
  let fixture: ComponentFixture<InstanceStorageCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstanceStorageCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstanceStorageCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
