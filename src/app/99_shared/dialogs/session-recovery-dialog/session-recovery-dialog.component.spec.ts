import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { SessionRecoveryDialog } from './session-recovery-dialog.component';

describe('SessionRecoveryDialog', () => {
  let dialogRef: jasmine.SpyObj<MatDialogRef<SessionRecoveryDialog>>;
  let component: SessionRecoveryDialog;

  beforeEach(() => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [SessionRecoveryDialog],
      providers: [{ provide: MatDialogRef, useValue: dialogRef }],
    });
    component = TestBed.createComponent(SessionRecoveryDialog).componentInstance;
  });

  it('emits login and enters the waiting state on confirm, without closing', () => {
    let emitted = false;
    component.login.subscribe(() => (emitted = true));

    component.confirm();

    expect(emitted).toBeTrue();
    expect(component.waiting()).toBeTrue();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('closes with false on cancel', () => {
    component.cancel();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
