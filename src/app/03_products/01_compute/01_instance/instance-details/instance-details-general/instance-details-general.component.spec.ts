import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstanceDetailsGeneralComponent } from './instance-details-general.component';

describe('InstanceDetailsGeneralComponent', () => {
  let component: InstanceDetailsGeneralComponent;
  let fixture: ComponentFixture<InstanceDetailsGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstanceDetailsGeneralComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstanceDetailsGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
