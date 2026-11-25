import { TestBed } from '@angular/core/testing';
import { AuthCompleteComponent } from './auth-complete.component';

describe('AuthCompleteComponent', () => {
  let received: Promise<unknown>;
  let channel: BroadcastChannel;

  beforeEach(() => {
    channel = new BroadcastChannel('spx-auth');
    received = new Promise(resolve => (channel.onmessage = event => resolve(event.data)));
    localStorage.removeItem('spx-auth');
    spyOn(window, 'close');

    TestBed.configureTestingModule({ imports: [AuthCompleteComponent] });
  });

  afterEach(() => channel.close());

  it('broadcasts done and writes localStorage even without window.opener, and attempts to close', async () => {
    expect(window.opener).toBeFalsy(); // Karma tab has no opener; the component must not depend on it
    TestBed.createComponent(AuthCompleteComponent);

    expect(await received).toBe('done');
    expect(localStorage.getItem('spx-auth')).not.toBeNull();
    expect(window.close).toHaveBeenCalled();
  });

  it('closes the tab when the "Close this tab" button is clicked', () => {
    const fixture = TestBed.createComponent(AuthCompleteComponent);
    fixture.detectChanges();
    (window.close as jasmine.Spy).calls.reset();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();

    expect(window.close).toHaveBeenCalled();
  });
});
