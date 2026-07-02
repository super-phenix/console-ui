import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EipListComponent } from './eip-list.component';

describe('EipListComponent', () => {
  let component: EipListComponent;
  let fixture: ComponentFixture<EipListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EipListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EipListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
