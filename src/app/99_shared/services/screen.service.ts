import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class ScreenService {
  protected breakpointObserver = inject(BreakpointObserver);

  private _isMobile = signal(false);
  isMobile = this._isMobile.asReadonly();

  private _isTablet = signal(false);
  isTablet = this._isTablet.asReadonly();

  private _isWeb = signal(false);
  isWeb = this._isWeb.asReadonly();

  constructor() {
    this.breakpointObserver
      .observe([Breakpoints.XSmall])
      .pipe(takeUntilDestroyed())
      .subscribe((state: BreakpointState) => {
        this._isMobile.set(state.matches);
      });

    this.breakpointObserver
      .observe([Breakpoints.Small, Breakpoints.Medium])
      .pipe(takeUntilDestroyed())
      .subscribe((state: BreakpointState) => {
        this._isTablet.set(state.matches);
      });

    this.breakpointObserver
      .observe([Breakpoints.Large, Breakpoints.XLarge])
      .pipe(takeUntilDestroyed())
      .subscribe((state: BreakpointState) => {
        this._isWeb.set(state.matches);
      });
  }
}

// Breakpoints descriptions
// XSmall	          - For very small screens (smartphones in portrait mode)
//                    (max-width: 599.98px)
// Small	          - For small screens (smartphones in landscape mode and small tablets)
//                    (min-width: 600px) and (max-width: 959.98px)
// Medium	          - For medium screens (tablets and small laptops)
//                    (min-width: 960px) and (max-width: 1279.98px)
// Large	          - For large screens (standard desktops)
//                    (min-width: 1280px) and (max-width: 1919.98px)
// XLarge	          - For very large screens (high-resolution monitors)
//                    (min-width: 1920px)
// Handset	        - For mobile devices, regardless of orientation
//                    (max-width: 599.98px) and (orientation: portrait), (max-width: 959.98px) and (orientation: landscape)
// Tablet	          - For tablets, taking orientation into account
//                    (min-width: 600px) and (max-width: 839.98px) and (orientation: portrait), (min-width: 960px) and (max-width: 1279.98px) and (orientation: landscape)
// Web	            - For desktop screens, regardless of orientation
//                    (min-width: 840px) and (orientation: portrait), (min-width: 1280px) and (orientation: landscape)
// HandsetPortrait	- For mobile devices in portrait mode only
//                    (max-width: 599.98px) and (orientation: portrait)
// TabletPortrait	  - For tablets in portrait mode only
//                    (min-width: 600px) and (max-width: 839.98px) and (orientation: portrait)
// WebPortrait	    - For desktop screens in portrait mode
//                    (min-width: 840px) and (orientation: portrait)
// HandsetLandscape	- For mobile devices in landscape mode only
//                    (max-width: 959.98px) and (orientation: landscape)
// TabletLandscape	- For tablets in landscape mode only
//                    (min-width: 960px) and (max-width: 1279.98px) and (orientation: landscape)
// WebLandscape	    - For desktop screens in landscape mode
//                    (min-width: 1280px) and (orientation: landscape)
