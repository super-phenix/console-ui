import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpanCopyComponent } from './span-copy.component';

describe('SpanCopyComponent', () => {
  let component: SpanCopyComponent;
  let fixture: ComponentFixture<SpanCopyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpanCopyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpanCopyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
