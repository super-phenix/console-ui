import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';

import { SidenavComponent } from './sidenav.component';

describe('SidenavComponent', () => {
  let component: SidenavComponent;
  let fixture: ComponentFixture<SidenavComponent>;
  let originalHelpLinks: typeof environment.helpLinks;

  beforeEach(() => {
    originalHelpLinks = environment.helpLinks;
  });

  afterEach(() => {
    (environment as any).helpLinks = originalHelpLinks;
  });

  async function createComponent(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [SidenavComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidenavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('should hide the help button when helpLinks is empty', async () => {
    (environment as any).helpLinks = [];
    await createComponent();

    const footer = fixture.debugElement.query(By.css('.sidenav__footer'));
    expect(footer).toBeNull();
  });

  it('should hide the help button when helpLinks is undefined', async () => {
    (environment as any).helpLinks = undefined;
    await createComponent();

    const footer = fixture.debugElement.query(By.css('.sidenav__footer'));
    expect(footer).toBeNull();
  });

  it('should show the help button when helpLinks has entries', async () => {
    (environment as any).helpLinks = [
      { icon: 'help', text: 'Help', url: 'https://example.com' },
    ];
    await createComponent();

    const footer = fixture.debugElement.query(By.css('.sidenav__footer'));
    expect(footer).not.toBeNull();
  });

  it('should render one menu item per help link', async () => {
    (environment as any).helpLinks = [
      { icon: 'live_help', text: 'Support', url: 'https://support.test' },
      { icon: 'docs', text: 'Docs', url: 'https://docs.test' },
    ];
    await createComponent();

    const button = fixture.debugElement.query(By.css('.sidenav__footer button'));
    button.nativeElement.click();
    fixture.detectChanges();

    const menuItems = document.querySelectorAll('.mat-mdc-menu-item');
    expect(menuItems.length).toBe(2);
  });

  it('should set the correct href and target on menu items', async () => {
    (environment as any).helpLinks = [
      { icon: 'live_help', text: 'Support', url: 'https://support.test' },
    ];
    await createComponent();

    const button = fixture.debugElement.query(By.css('.sidenav__footer button'));
    button.nativeElement.click();
    fixture.detectChanges();

    const anchor = document.querySelector('.mat-mdc-menu-item') as HTMLAnchorElement;
    expect(anchor.href).toBe('https://support.test/');
    expect(anchor.target).toBe('_blank');
  });

  it('should display the correct icon and text for each link', async () => {
    (environment as any).helpLinks = [
      { icon: 'live_help', text: 'Support', url: 'https://support.test' },
    ];
    await createComponent();

    const button = fixture.debugElement.query(By.css('.sidenav__footer button'));
    button.nativeElement.click();
    fixture.detectChanges();

    const menuItem = document.querySelector('.mat-mdc-menu-item');
    expect(menuItem?.textContent).toContain('live_help');
    expect(menuItem?.textContent).toContain('Support');
  });
});
