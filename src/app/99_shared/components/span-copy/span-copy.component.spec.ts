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
    fixture.componentRef.setInput('value', 'id-1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('hides the copy button until hover when asked', () => {
    fixture.componentRef.setInput('boxed', true);
    fixture.componentRef.setInput('copyOnHover', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.span-copy__button');
    expect(button.classList).toContain('span-copy__button--hover');
  });

  it('keeps the same inset on both sides of an id chip', () => {
    fixture.componentRef.setInput('boxed', true);
    fixture.detectChanges();

    const box = fixture.nativeElement.querySelector('.span-copy__value--box') as HTMLElement;
    const style = getComputedStyle(box);

    expect(style.paddingLeft).toBe(style.paddingRight);
    expect(parseFloat(style.paddingLeft)).toBeGreaterThan(0);
  });

  it('fades an id that does not fit instead of clipping it with an ellipsis', async () => {
    fixture.componentRef.setInput('boxed', true);
    fixture.componentRef.setInput('value', 'id-'.repeat(40));
    const host = fixture.nativeElement as HTMLElement;
    host.style.display = 'block';
    host.style.width = '120px';
    fixture.detectChanges();
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    fixture.detectChanges();

    const text = host.querySelector('.span-copy__text') as HTMLElement;
    expect(text.classList).toContain('span-copy__text--fade');
    expect(getComputedStyle(text).textOverflow).not.toBe('ellipsis');
  });
});
