import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';

import { CallbackComponent } from './callback.component';

describe('CallbackComponent', () => {
  it('opens the inactive account page', () => {
    const navigate = jasmine.createSpy('navigate');
    TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        { provide: Router, useValue: { navigate } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ not_active: 'true' }) } },
        },
      ],
    });

    const fixture = TestBed.createComponent(CallbackComponent);

    expect(fixture.componentInstance).toBeTruthy();
    expect(navigate).toHaveBeenCalledOnceWith(['/', 'inactive-account']);
  });
});
