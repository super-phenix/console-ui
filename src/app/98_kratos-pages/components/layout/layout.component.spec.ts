import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterOutlet } from '@angular/router';
import { By } from '@angular/platform-browser';
import { LayoutComponent } from './layout.component';

describe('LayoutComponent', () => {
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should contain a router-outlet', () => {
    const outlet = fixture.debugElement.query(By.directive(RouterOutlet));
    expect(outlet).toBeTruthy();
  });

  it('should not render a footer', () => {
    expect(fixture.debugElement.query(By.css('.app__footer'))).toBeNull();
  });

  it('should paint the side illustration from the theme image variable', () => {
    const visual = fixture.debugElement.query(By.css('.app__visual'));
    expect(visual).toBeTruthy();
    const style = getComputedStyle(visual.nativeElement);
    const illustration = getComputedStyle(visual.nativeElement, '::before');
    expect(style.backgroundColor).toBe('rgb(26, 22, 23)');
    expect(illustration.backgroundImage).toContain('auth-visual.svg');
    expect(illustration.backgroundSize).toBe('contain');
    const rules = [...document.styleSheets].flatMap(sheet => {
      try {
        return [...sheet.cssRules].map(rule => rule.cssText);
      } catch {
        return [];
      }
    });
    expect(rules.some(rule => rule.includes('scale(0.8)'))).toBeTrue();
  });

  it('should fill the viewport height with the form column', () => {
    const section = fixture.debugElement.query(By.css('.app__section')).nativeElement as HTMLElement;

    expect(section.getBoundingClientRect().height).toBeGreaterThanOrEqual(window.innerHeight);
  });

  it('should keep the illustration in view when the form is taller than the viewport', () => {
    const outlet = fixture.debugElement.query(By.css('.app__router')).nativeElement as HTMLElement;
    const tall = document.createElement('div');
    tall.style.height = `${window.innerHeight * 3}px`;
    outlet.append(tall);
    const visual = getComputedStyle(fixture.debugElement.query(By.css('.app__visual')).nativeElement);

    // Below 950px the illustration is hidden, so its position is checked rather than its size.
    expect(visual.position).toBe('sticky');
    expect(visual.top).toBe('0px');
    expect(
      fixture.debugElement.query(By.css('.app__section')).nativeElement.getBoundingClientRect().height
    ).toBeGreaterThanOrEqual(window.innerHeight * 3);
  });

  it('should not render a theme switch', () => {
    expect(fixture.debugElement.query(By.css('.app__header'))).toBeNull();
    expect(fixture.debugElement.query(By.css('mat-button-toggle-group'))).toBeNull();
  });
});
