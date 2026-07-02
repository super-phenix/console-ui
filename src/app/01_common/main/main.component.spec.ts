import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MainComponent } from './main.component';

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render logo as a CSS background-image div instead of an img element', () => {
    const logoDiv = fixture.nativeElement.querySelector('.application-logo');
    expect(logoDiv).toBeTruthy();
    expect(logoDiv.getAttribute('role')).toBe('img');
    expect(logoDiv.getAttribute('aria-label')).toBe('SPX Logo');

    const logoImg = fixture.nativeElement.querySelector('.application-logo img');
    expect(logoImg).toBeNull();
  });
});
