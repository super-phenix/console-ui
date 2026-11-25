import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { InactiveAccountComponent } from './inactive-account.component';

describe('AccountInactiveComponent', () => {
  let component: InactiveAccountComponent;
  let fixture: ComponentFixture<InactiveAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InactiveAccountComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InactiveAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the wordmark as a CSS background instead of an img element', () => {
    const logoDiv = fixture.nativeElement.querySelector('.flow__app-logo');
    expect(logoDiv).toBeTruthy();
    expect(logoDiv.getAttribute('role')).toBe('img');
    expect(logoDiv.getAttribute('aria-label')).toBe('Superphenix Logo');
    expect(getComputedStyle(logoDiv).backgroundImage).toContain('logo-full.svg');

    const logoImg = fixture.nativeElement.querySelector('img');
    expect(logoImg).toBeNull();
  });
});
