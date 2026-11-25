import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { VirtualKeyboardComponent } from './virtual-keyboard/virtual-keyboard.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { CONTROLLER_PATH, WS_PROTOCOL, environment } from '@env/environment';
import { SESSION_TOKEN_URL } from '@shared/services/auth.service';
import * as RFB from '@novnc/novnc/lib/rfb';
import { Session } from '@shared/models/data/user';
import { firstValueFrom } from 'rxjs';
import { DEFAULT_GUEST_LAYOUT, GUEST_LAYOUTS, buildCharMap, charToKeysym, resolveGuestLayout } from './keyboard-layouts';

const GUEST_LAYOUT_STORAGE_PREFIX = 'spx.vnc.guestLayout.';

@Component({
  selector: 'spx-vnc',
  imports: [MatButtonModule, MatIcon, VirtualKeyboardComponent],
  templateUrl: './vnc.component.html',
  styleUrl: './vnc.component.scss',
})
export class VNCComponent implements OnInit {
  private http = inject(HttpClient);

  destroyRef = inject(DestroyRef);

  orgaId!: string;
  projectId!: string;

  vmName: string | null;
  codeAz: string | null;

  statusElement = viewChild<ElementRef<HTMLElement>>('status');
  screenContainer = viewChild<ElementRef<HTMLElement>>('screen');
  desktopName?: string;

  rfb?: RFB.default;

  showVirtualKeyboard = signal(false);

  // Keyboard layout configured inside the guest OS. VNC does not expose it, so the user picks it
  // on the virtual keyboard and we store the choice per VM. Paste follows it too.
  guestLayout = signal(DEFAULT_GUEST_LAYOUT);
  guestLayoutLabel = computed(() => GUEST_LAYOUTS.find(l => l.id === this.guestLayout())?.label ?? '');

  constructor() {
    const route = inject(ActivatedRoute);

    this.orgaId = route.snapshot.paramMap.get('orgId') || '';
    this.projectId = route.snapshot.paramMap.get('projectId') || '';
    this.codeAz = route.snapshot.paramMap.get('az') || '';
    this.vmName = route.snapshot.paramMap.get('productId') || '';

    this.guestLayout.set(this.readStoredGuestLayout());

    this.destroyRef.onDestroy(() => this.cleanup());
  }

  private readStoredGuestLayout(): string {
    try {
      return resolveGuestLayout(localStorage.getItem(GUEST_LAYOUT_STORAGE_PREFIX + this.vmName));
    } catch {
      return DEFAULT_GUEST_LAYOUT;
    }
  }

  setGuestLayout(layout: string) {
    this.guestLayout.set(layout);
    try {
      localStorage.setItem(GUEST_LAYOUT_STORAGE_PREFIX + this.vmName, layout);
    } catch {
      // Storage unavailable: the choice lasts until the page closes.
    }
    // Let the menu close and restore focus first, then give focus back to the canvas.
    setTimeout(() => this.rfb?.focus());
  }

  ngOnInit() {
    if (this.vmName) {
      this.initVNC();
    } else {
      console.log('Failed to initialize connection');
    }
  }

  async initVNC() {
    let res: Session;
    try {
      res = await firstValueFrom(this.http.get<Session>(SESSION_TOKEN_URL, { withCredentials: true }));
    } catch (err) {
      console.error('Failed to retrieve session token', err);
      this.updateStatus('Error: Unable to authenticate. Please refresh the page.');
      return;
    }

    const accessToken = res.session;
    const wsUrl = `${WS_PROTOCOL}${environment.apiUrl}/${this.orgaId}${CONTROLLER_PATH}/${this.codeAz}/${this.projectId}/instance/${this.vmName}/vnc?bearer=${accessToken}`;

    const container = this.screenContainer()?.nativeElement;
    if (!container) {
      console.error('VNC screen container element not found');
      return;
    }

    try {
      this.rfb = new RFB.default(container, wsUrl);
      this.rfb.viewOnly = false;
      this.rfb.scaleViewport = true;

      this.rfb.addEventListener('connect', this.connectedToServer.bind(this));
      this.rfb.addEventListener('disconnect', this.disconnectedFromServer.bind(this));
      this.rfb.addEventListener('desktopname', this.updateDesktopName.bind(this));

      this.updateStatus('Connecting...');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error creating RFB:', err);
      this.updateStatus('Error: ' + err.message);
    }
  }

  refreshSession() {
    if (this.rfb) {
      console.log('disconnecting previous session');
      this.rfb.disconnect();
    }
    this.initVNC();
  }

  updateStatus(text: string) {
    if (this.statusElement()) {
      this.statusElement()!.nativeElement.textContent = text;
    }
  }

  connectedToServer() {
    this.updateStatus('Connected to ' + this.desktopName);
  }

  disconnectedFromServer(e: { detail: { clean: string } }) {
    if (e.detail.clean) {
      this.updateStatus('Disconnected cleanly');
    } else {
      this.updateStatus('Connection error');
    }
  }

  // credentialsAreRequired() {
  //   if (this.rfb) {
  //     const password = prompt('Password required:');
  //     this.rfb.sendCredentials({ password });
  //   }
  // }

  updateDesktopName(e: { detail: { name: string } }) {
    this.desktopName = e.detail.name;
  }

  sendCtrlAltDel() {
    if (this.rfb) {
      this.rfb.sendCtrlAltDel();
    }
    return false;
  }

  private static readonly XK_SHIFT_L = 0xffe1;
  private static readonly XK_ALT_R = 0xffea;

  // Types the clipboard text into the VM by pressing the keys that produce each character on the
  // guest layout, whereas clipboardPasteFrom sets the server clipboard and types nothing.
  async paste() {
    if (!this.rfb) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const charMap = buildCharMap(this.guestLayout());
      const skipped = new Set<string>();
      for (const char of text.replace(/\r\n?/g, '\n')) {
        const stroke = charMap.get(char);
        if (!stroke) {
          skipped.add(char);
          continue;
        }

        const keysym = stroke.code === 'Enter' ? 0xff0d : stroke.code === 'Tab' ? 0xff09 : charToKeysym(char);
        if (stroke.shift) {
          this.rfb.sendKey(VNCComponent.XK_SHIFT_L, 'ShiftLeft', true);
        }
        this.rfb.sendKey(keysym, stroke.code, true);
        this.rfb.sendKey(keysym, stroke.code, false);
        if (stroke.shift) {
          this.rfb.sendKey(VNCComponent.XK_SHIFT_L, 'ShiftLeft', false);
        }
      }
      if (skipped.size) {
        this.updateStatus(`Pasted, except characters not on the ${this.guestLayoutLabel()} layout: ${[...skipped].join(' ')}`);
      }
    } catch (err) {
      console.error('Clipboard error:', err);
      alert('Unable to read the clipboard.');
    }
  }

  toggleVirtualKeyboard() {
    this.showVirtualKeyboard.update(v => !v);

    // After the DOM updates (keyboard shown/hidden), re-trigger the VNC
    // viewport scaling so the display adapts to the new available space.
    setTimeout(() => {
      if (this.rfb) {
        this.rfb.scaleViewport = true;
      }
    });
  }

  private static readonly XK_CTRL_L = 0xffe3;
  private static readonly XK_ALT_L = 0xffe9;

  onVirtualKeyPress(event: {
    keysym: number;
    code?: string;
    needsShift: boolean;
    needsCtrl: boolean;
    needsAlt: boolean;
    needsAltGr?: boolean;
  }) {
    if (!this.rfb) return;

    // Use the DOM code string when available so that noVNC can send
    // the scancode of the key position.
    const code = event.code ?? null;

    if (event.needsCtrl) {
      this.rfb.sendKey(VNCComponent.XK_CTRL_L, 'ControlLeft', true);
    }
    if (event.needsAlt) {
      this.rfb.sendKey(VNCComponent.XK_ALT_L, 'AltLeft', true);
    }
    if (event.needsShift) {
      this.rfb.sendKey(VNCComponent.XK_SHIFT_L, 'ShiftLeft', true);
    }
    if (event.needsAltGr) {
      this.rfb.sendKey(VNCComponent.XK_ALT_R, 'AltRight', true);
    }
    this.rfb.sendKey(event.keysym, code, true);
    this.rfb.sendKey(event.keysym, code, false);
    if (event.needsAltGr) {
      this.rfb.sendKey(VNCComponent.XK_ALT_R, 'AltRight', false);
    }
    if (event.needsShift) {
      this.rfb.sendKey(VNCComponent.XK_SHIFT_L, 'ShiftLeft', false);
    }
    if (event.needsAlt) {
      this.rfb.sendKey(VNCComponent.XK_ALT_L, 'AltLeft', false);
    }
    if (event.needsCtrl) {
      this.rfb.sendKey(VNCComponent.XK_CTRL_L, 'ControlLeft', false);
    }
  }

  private cleanup() {
    if (this.rfb) {
      this.rfb.disconnect();
      this.rfb = undefined;
    }
  }
}
