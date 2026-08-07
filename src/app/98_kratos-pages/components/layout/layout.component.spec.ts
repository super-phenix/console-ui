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

  it('should render the footer with logo and copyright', () => {
    const footer = fixture.debugElement.query(By.css('.app__footer'));
    expect(footer).toBeTruthy();

    const logo = footer.query(By.css('.footer__logo'));
    expect(logo.nativeElement.tagName).toBe('DIV');

    const copyright = footer.query(By.css('.footer__copyright'));
    expect(copyright.nativeElement.textContent).toContain('© 2026');
  });

  it('should have the app logo section', () => {
    const logo = fixture.debugElement.query(By.css('.app__logo'));
    expect(logo).toBeTruthy();
  });
});
