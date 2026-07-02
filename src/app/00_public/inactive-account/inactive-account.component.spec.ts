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

  it('should render logo as a CSS background-image div instead of an img element', () => {
    const logoDiv = fixture.nativeElement.querySelector('.inactive-account__logo');
    expect(logoDiv).toBeTruthy();
    expect(logoDiv.getAttribute('role')).toBe('img');
    expect(logoDiv.getAttribute('aria-label')).toBe('Superphenix Logo');

    const logoImg = fixture.nativeElement.querySelector('img[alt="Superphenix Logo"]');
    expect(logoImg).toBeNull();
  });
});
