import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NEVER, Observable, of, Subject } from 'rxjs';
import { SessionRecoveryDialog } from '../dialogs/session-recovery-dialog/session-recovery-dialog.component';
import { AuthService } from './auth.service';
import { SessionRecoveryService } from './session-recovery.service';

describe('SessionRecoveryService', () => {
  let service: SessionRecoveryService;
  let auth: jasmine.SpyObj<AuthService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const tick = () => new Promise(resolve => setTimeout(resolve));
  // Drain promise microtasks while jasmine.clock controls timers.
  const microflush = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  };

  // Mock the dialog ref: `login` is the Subject the dialog emits on "Log in",
  // `afterClosed` drives the cancel path, `close` is asserted on teardown.
  function setupDialog(afterClosed: Observable<unknown>, login = new Subject<void>()) {
    const close = jasmine.createSpy('close');
    const ref = { componentInstance: { login }, afterClosed: () => afterClosed, close };
    dialog.open.and.returnValue(ref as unknown as MatDialogRef<SessionRecoveryDialog>);
    return { login, close, ref };
  }

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['openLoginPopup', 'renewAccessToken', 'redirectToFlow']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [
        SessionRecoveryService,
        { provide: AuthService, useValue: auth },
        { provide: MatDialog, useValue: dialog },
      ],
    });
    service = TestBed.inject(SessionRecoveryService);
  });

  it('rejects, closes the dialog, and never opens the login tab when the user cancels', async () => {
    const { close } = setupDialog(of(false));

    await expectAsync(service.recover()).toBeRejected();
    expect(auth.openLoginPopup).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('shares a single dialog across concurrent recover() calls', async () => {
    setupDialog(of(false));
    const a = service.recover();
    const b = service.recover();
    await Promise.allSettled([a, b]);
    expect(dialog.open).toHaveBeenCalledTimes(1);
  });

  it('falls back to a full-page redirect when the popup is blocked', async () => {
    const { login } = setupDialog(NEVER);
    auth.openLoginPopup.and.returnValue(null);

    service.recover(); // never resolves (page would navigate away); do not await
    await tick();
    login.next();
    await tick();

    expect(auth.openLoginPopup).toHaveBeenCalledWith('/auth-complete');
    expect(auth.redirectToFlow).toHaveBeenCalledWith('login', jasmine.any(String));
  });

  it('renews, resolves, and closes the dialog once the login tab pings completion', async () => {
    const { login, close } = setupDialog(NEVER);
    auth.openLoginPopup.and.returnValue({ closed: false } as Window);
    auth.renewAccessToken.and.resolveTo('newtok');

    const recovered = service.recover();
    await tick(); // let the dialog open and the race subscribe
    login.next();
    await tick(); // let recovery register the channel listener
    new BroadcastChannel('spx-auth').postMessage('done');

    await recovered;
    expect(auth.renewAccessToken).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('rejects and closes the dialog when the wait times out', async () => {
    jasmine.clock().install();
    const { login, close } = setupDialog(NEVER);
    auth.openLoginPopup.and.returnValue({ closed: false } as Window);

    const recovered = service.recover();
    await microflush();
    login.next();
    await microflush(); // recovery now awaits the completion signal
    jasmine.clock().tick(5 * 60 * 1000 + 1);
    await microflush();

    await expectAsync(recovered).toBeRejected();
    expect(auth.renewAccessToken).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    jasmine.clock().uninstall();
  });

  it('rejects and closes the dialog when the login tab is closed without finishing', async () => {
    jasmine.clock().install();
    const popup = { closed: false } as Window;
    const { login, close } = setupDialog(NEVER);
    auth.openLoginPopup.and.returnValue(popup);

    const recovered = service.recover();
    await microflush();
    login.next();
    await microflush();
    (popup as { closed: boolean }).closed = true;
    jasmine.clock().tick(600); // next popup poll detects the closed tab
    await microflush();

    await expectAsync(recovered).toBeRejected();
    expect(auth.renewAccessToken).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    jasmine.clock().uninstall();
  });
});
