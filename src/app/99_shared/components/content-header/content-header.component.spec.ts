import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { StateService } from '@shared/services/state.service';
import { ContentHeaderComponent } from './content-header.component';

describe('ContentHeaderComponent', () => {
  let fixture: ComponentFixture<ContentHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentHeaderComponent],
      providers: [provideRouter([]), { provide: StateService, useValue: { project: signal(undefined) } }],
    }).compileComponents();
  });

  it('renders the product trail from the route', () => {
    const router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/products/compute/instance/details/az-1/vm-1');

    fixture = TestBed.createComponent(ContentHeaderComponent);
    fixture.componentRef.setInput('title', 'Instance details');
    fixture.detectChanges();

    const labels = [...fixture.nativeElement.querySelectorAll('.breadcrumb__label, .breadcrumb__link')].map(node =>
      (node as HTMLElement).textContent?.trim(),
    );
    expect(labels).toEqual(['Compute', 'Instance']);
    expect(fixture.nativeElement.querySelector('.breadcrumb__icon')?.textContent).toContain('memory');
    expect(fixture.nativeElement.querySelector('h1')).toBeNull();
  });

  it('shows the resource name once it is known', () => {
    const router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/products/compute/instance/details/az-1/vm-1');

    fixture = TestBed.createComponent(ContentHeaderComponent);
    fixture.componentRef.setInput('resourceName', 'web-01');
    fixture.componentRef.setInput('resourceId', 'vm-1');
    fixture.detectChanges();

    const labels = [...fixture.nativeElement.querySelectorAll('.breadcrumb__label, .breadcrumb__link')].map(node =>
      (node as HTMLElement).textContent?.trim(),
    );
    expect(labels).toEqual(['Compute', 'Instance', 'web-01']);
  });

  it('keeps the page title outside product routes', () => {
    fixture = TestBed.createComponent(ContentHeaderComponent);
    fixture.componentRef.setInput('title', 'Dashboard');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Dashboard');
    expect(fixture.nativeElement.querySelector('.breadcrumb')).toBeNull();
  });
});
